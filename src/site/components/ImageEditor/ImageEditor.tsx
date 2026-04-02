import * as panzoom from '@panzoom/panzoom';
import type { UploadFile } from '@solid-primitives/upload';
import { createFileUploader } from '@solid-primitives/upload';
import clsx from 'clsx';
import JsFileDownloader from 'js-file-downloader';
import type { Component } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { aspectRatioToReadableText, getAspectRatioHeightMultiplier } from '../../../core/entities/media.js';
import type { Option } from '../../../core/entities/option.js';
import { ORIGINAL_OPTION } from '../../../core/entities/option.js';
import { PostAspectRatio } from '../../../core/entities/post.js';
import { ImageResourceExtension } from '../../../core/entities/resource.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { Button } from '../Button/Button.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Label } from '../Label/Label.jsx';
import { RadioGroup } from '../RadioGroup/RadioGroup.jsx';
import { Slider } from '../Slider/Slider.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './ImageEditor.module.css';

const Panzoom = panzoom.default;

interface FilterValues {
  exposure: number;
  brightness: number;
  contrast: number;
  shadows: number;
  highlights: number;
  saturation: number;
}

const defaultFilters: FilterValues = {
  exposure: 1,
  brightness: 0,
  contrast: 1,
  shadows: 0,
  highlights: 0,
  saturation: 1,
};

const MIN_PX = 800;

const PANZOOM_DURATION = 500;

interface CropBoxPercent {
  top: number;
  left: number;
  width: number;
  height: number;
}

const getEventPosition = (e: MouseEvent | TouchEvent) => {
  if ('touches' in e) {
    const touch = e.touches[0];
    return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
  }
  return { x: e.clientX, y: e.clientY };
};

export interface ImageEditorRef {
  getResultDataUrl: () => string | undefined;
  hasChanges: () => boolean;
}

export interface ImageEditorProps {
  url?: string;
  ref?: (ref: ImageEditorRef) => void;
}

export const ImageEditor: Component<ImageEditorProps> = (props) => {
  const { addToast } = useToaster();

  let imgRef: HTMLImageElement | undefined;
  let cropBoxRef: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let panzoom: ReturnType<typeof Panzoom> | undefined;

  const cropOptions = (): Option<PostAspectRatio>[] => [
    ORIGINAL_OPTION,
    ...PostAspectRatio.options.map((value) => ({
      label: aspectRatioToReadableText(value),
      value,
    })),
  ];

  const { files, selectFiles } = createFileUploader({ accept: ImageResourceExtension.options.join(', ') });

  const [originalUrl, setOriginalUrl] = createSignal<string>();
  const [currentUrl, setCurrentUrl] = createSignal<string>();
  const [isCropApplied, setIsCropApplied] = createSignal(false);
  const [cropRatio, setCropRatio] = createSignal<PostAspectRatio>();
  const [isComparing, setIsComparing] = createSignal(false);
  const [zoom, setZoom] = createSignal(1);
  const [isPanApplied, setIsPanApplied] = createSignal(false);
  const [isResettingZoomAndPan, setIsResettingZoomAndPan] = createSignal(false);

  const hasLoadingError = createMemo(() => currentUrl() === YellowExclamationMark);

  const filename = createMemo(() => {
    if (props.url) {
      const [, filename] = props.url.split(/\/([^\/]+)$/);
      return filename;
    }

    return files()[0]?.name;
  });

  const [appliedCropBox, setAppliedCropBox] = createSignal<CropBoxPercent>();
  const [isApplyingCrop, setIsApplyingCrop] = createSignal(false);

  // Filter signals
  const [exposure, setExposure] = createSignal(defaultFilters.exposure);
  const [brightness, setBrightness] = createSignal(defaultFilters.brightness);
  const [contrast, setContrast] = createSignal(defaultFilters.contrast);
  const [shadows, setShadows] = createSignal(defaultFilters.shadows);
  const [highlights, setHighlights] = createSignal(defaultFilters.highlights);
  const [saturation, setSaturation] = createSignal(defaultFilters.saturation);

  // Computed values for filters - using createMemo
  const exposureContrastSlope = createMemo(() => exposure() * contrast());
  const exposureContrastIntercept = createMemo(() => 0.5 * (1 - contrast()));
  const shadowsSlope = createMemo(() => 1 + shadows() * 2);
  const highlightsSlope = createMemo(() => 1 - highlights() * 0.8);

  const shouldApplyFilter = createMemo(() => {
    return (
      Math.abs(exposure() - defaultFilters.exposure) > 0.01 ||
      Math.abs(brightness() - defaultFilters.brightness) > 0.01 ||
      Math.abs(contrast() - defaultFilters.contrast) > 0.01 ||
      Math.abs(shadows() - defaultFilters.shadows) > 0.01 ||
      Math.abs(highlights() - defaultFilters.highlights) > 0.01 ||
      Math.abs(saturation() - defaultFilters.saturation) > 0.01
    );
  });

  const imageFilter = createMemo(() => {
    if (isComparing() || hasLoadingError()) {
      return 'none';
    }
    return shouldApplyFilter() ? 'url(#masterFilter)' : 'none';
  });

  // Crop state - stored as percentages
  const [cropBox, setCropBox] = createSignal<CropBoxPercent>({ top: 0, left: 0, width: 0, height: 0 });
  const [isDraggingCropBox, setIsDraggingCropBox] = createSignal(false);
  const [activeCropBoxHandle, setActiveCropBoxHandle] = createSignal<string>();
  const [startMousePos, setStartMousePos] = createSignal({ x: 0, y: 0 });
  const [startCropBox, setStartCropBox] = createSignal<CropBoxPercent>({ top: 0, left: 0, width: 0, height: 0 });

  const hasChanges = createMemo(() => !hasLoadingError() && (shouldApplyFilter() || isCropApplied()));

  // CSS styles - just convert percentages to strings
  const cropBoxStyle = createMemo(() => {
    const box = cropBox();
    return {
      top: `${box.top}%`,
      left: `${box.left}%`,
      width: `${box.width}%`,
      height: `${box.height}%`,
      display: cropRatio() && !isCropApplied() && !hasLoadingError() ? 'block' : 'none',
    };
  });

  const setupCropFrame = (ratio: PostAspectRatio | undefined) => {
    if (!containerRef || !ratio || currentUrl() === YellowExclamationMark) {
      return;
    }

    const heightMultiplier = getAspectRatioHeightMultiplier(ratio);
    const rect = containerRef.getBoundingClientRect();

    // Calculate in pixels first
    let newWidthPx = rect.width;
    let newHeightPx = newWidthPx * heightMultiplier;

    if (newHeightPx > rect.height) {
      newHeightPx = rect.height;
      newWidthPx = newHeightPx / heightMultiplier;
    }

    // Convert to percentages
    const newWidth = (newWidthPx / rect.width) * 100;
    const newHeight = (newHeightPx / rect.height) * 100;
    const newLeft = ((rect.width - newWidthPx) / 2 / rect.width) * 100;
    const newTop = ((rect.height - newHeightPx) / 2 / rect.height) * 100;

    setCropBox({
      width: newWidth,
      height: newHeight,
      left: newLeft,
      top: newTop,
    });
    setCropRatio(ratio);
  };

  const applyCrop = () => {
    if (!imgRef || !containerRef) return;

    const ratio = cropRatio();

    if (!ratio) {
      setIsCropApplied(true);
      return;
    }

    const boxPercent = cropBox();
    const containerRect = containerRef.getBoundingClientRect();
    const imgRect = imgRef.getBoundingClientRect();

    // Convert percentage to pixels
    const boxPx = {
      left: (boxPercent.left / 100) * containerRect.width,
      top: (boxPercent.top / 100) * containerRect.height,
      width: (boxPercent.width / 100) * containerRect.width,
      height: (boxPercent.height / 100) * containerRect.height,
    };

    // Calculate scale factors
    const scaleX = imgRef.naturalWidth / imgRect.width;
    const scaleY = imgRef.naturalHeight / imgRect.height;

    // Calculate crop area relative to image
    const relativeLeft = (boxPx.left - (imgRect.left - containerRect.left)) / imgRect.width;
    const relativeTop = (boxPx.top - (imgRect.top - containerRect.top)) / imgRect.height;
    const relativeWidth = boxPx.width / imgRect.width;
    const relativeHeight = boxPx.height / imgRect.height;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = boxPx.width * scaleX;
      canvas.height = boxPx.height * scaleY;

      if (!ctx) {
        throw new Error('Failed to get Canvas context.');
      }

      ctx.drawImage(
        imgRef,
        relativeLeft * imgRef.naturalWidth,
        relativeTop * imgRef.naturalHeight,
        relativeWidth * imgRef.naturalWidth,
        relativeHeight * imgRef.naturalHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const croppedDataUrl = canvas.toDataURL();

      setIsApplyingCrop(true);
      setCurrentUrl(croppedDataUrl);
      setAppliedCropBox(boxPercent);
      setIsCropApplied(true);

      setTimeout(() => setIsApplyingCrop(false), 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : error ? error.toString() : 'Failed to crop';
      addToast(message);
    }
  };

  const handleChangeCrop = () => {
    setIsApplyingCrop(true);
    setCurrentUrl(originalUrl());
    setIsCropApplied(false);

    const last = appliedCropBox();
    if (last) {
      setCropBox(last);
    } else {
      setCropRatio(undefined);
    }

    setTimeout(() => setIsApplyingCrop(false), 100);
  };

  const resetFilters = () => {
    setExposure(defaultFilters.exposure);
    setBrightness(defaultFilters.brightness);
    setContrast(defaultFilters.contrast);
    setShadows(defaultFilters.shadows);
    setHighlights(defaultFilters.highlights);
    setSaturation(defaultFilters.saturation);
  };

  const processUploadFiles = async (items: UploadFile[]) => {
    const file = items[0]?.file;
    if (!file) {
      return;
    }

    if (originalUrl()) {
      URL.revokeObjectURL(originalUrl()!);
    }

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setCurrentUrl(url);
    resetFilters();
    setIsCropApplied(false);
    setCropRatio(undefined);
    panzoom?.reset({ animate: false });
  };

  const handleCompareStart = () => {
    setIsComparing(true);
  };

  // Crop handlers with percentage-based calculations
  const handleCropStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (isCropApplied()) return;

    const target = e.target as HTMLElement;
    if (target.dataset.handle) {
      setActiveCropBoxHandle(target.dataset.handle);
    } else if (target === cropBoxRef || cropBoxRef?.contains(target)) {
      setIsDraggingCropBox(true);
    } else {
      return;
    }

    const pos = getEventPosition(e);
    setStartMousePos(pos);
    setStartCropBox({ ...cropBox() });
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingCropBox() && !activeCropBoxHandle()) {
      return;
    }

    e.preventDefault();

    const pos = getEventPosition(e);
    if (!containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    const ratio = cropRatio();
    if (!ratio) {
      return;
    }

    const heightMultiplier = getAspectRatioHeightMultiplier(ratio);

    // Convert percentages to pixels for accurate calculations
    const startPx = {
      left: (startCropBox().left / 100) * rect.width,
      top: (startCropBox().top / 100) * rect.height,
      width: (startCropBox().width / 100) * rect.width,
      height: (startCropBox().height / 100) * rect.height,
    };

    // Convert mouse movement to pixels
    const dxPx = pos.x - startMousePos().x;
    const dyPx = pos.y - startMousePos().y;

    const imgRect = imgRef?.getBoundingClientRect();
    const scale = imgRef ? imgRef.naturalWidth / (imgRect?.width || 1) : 1;
    const minWidthPx = Math.max(MIN_PX / scale, MIN_PX / scale / heightMultiplier);
    const minHeightPx = minWidthPx * heightMultiplier;

    let newBoxPx = { ...startPx };

    if (isDraggingCropBox()) {
      // Drag the crop box
      let newLeft = startPx.left + dxPx;
      let newTop = startPx.top + dyPx;

      // Constrain to container bounds
      newLeft = Math.max(0, Math.min(newLeft, rect.width - startPx.width));
      newTop = Math.max(0, Math.min(newTop, rect.height - startPx.height));

      newBoxPx = {
        left: newLeft,
        top: newTop,
        width: startPx.width,
        height: startPx.height,
      };
    } else {
      const handle = activeCropBoxHandle();

      let nL = startPx.left;
      let nT = startPx.top;
      let nW = startPx.width;
      let nH = startPx.height;

      // Apply resize based on handle
      switch (handle) {
        // Corners
        case 'se': // south-east
          nW = Math.max(minWidthPx, startPx.width + dxPx);
          nH = nW * heightMultiplier;
          break;

        case 'sw': // south-west
          {
            const deltaW = Math.min(dxPx, startPx.width - minWidthPx);
            nL = startPx.left + deltaW;
            nW = startPx.width - deltaW;
            nH = nW * heightMultiplier;
          }
          break;

        case 'ne': // north-east
          {
            const deltaH = Math.min(dyPx, startPx.height - minHeightPx);
            nT = startPx.top + deltaH;
            nH = startPx.height - deltaH;
            nW = nH / heightMultiplier;
          }
          break;

        case 'nw': // north-west
          {
            const deltaW = Math.min(dxPx, startPx.width - minWidthPx);
            const deltaH = Math.min(dyPx, startPx.height - minHeightPx);
            nL = startPx.left + deltaW;
            nT = startPx.top + deltaH;
            nW = startPx.width - deltaW;
            nH = startPx.height - deltaH;

            // Maintain aspect ratio
            if (Math.abs(deltaW / startPx.width) > Math.abs(deltaH / startPx.height)) {
              nH = nW * heightMultiplier;
            } else {
              nW = nH / heightMultiplier;
            }
          }
          break;

        // Edges
        case 'e':
          nW = Math.max(minWidthPx, startPx.width + dxPx);
          nH = nW * heightMultiplier;
          break;

        case 's':
          nH = Math.max(minHeightPx, startPx.height + dyPx);
          nW = nH / heightMultiplier;
          break;

        case 'w': {
          const deltaW = Math.min(dxPx, startPx.width - minWidthPx);
          nL = startPx.left + deltaW;
          nW = startPx.width - deltaW;
          nH = nW * heightMultiplier;
          break;
        }

        case 'n': {
          const deltaH = Math.min(dyPx, startPx.height - minHeightPx);
          nT = startPx.top + deltaH;
          nH = startPx.height - deltaH;
          nW = nH / heightMultiplier;
          break;
        }

        default:
      }

      // Clamp to minimum size
      nW = Math.max(minWidthPx, nW);
      nH = nW * heightMultiplier;

      // Ensure dimensions don't exceed container bounds
      if (nL + nW > rect.width) {
        nW = rect.width - nL;
        nH = nW * heightMultiplier;
      }

      if (nT + nH > rect.height) {
        nH = rect.height - nT;
        nW = nH / heightMultiplier;
        // Adjust width to maintain aspect ratio after height adjustment
        if (nT + nH > rect.height) {
          nH = rect.height - nT;
          nW = nH / heightMultiplier;
        }
      }

      // If after adjusting, the width/height became too small, readjust
      if (nW < minWidthPx) {
        nW = minWidthPx;
        nH = nW * heightMultiplier;
        // Re-constrain position if needed
        if (nL + nW > rect.width) {
          nL = rect.width - nW;
        }
        if (nT + nH > rect.height) {
          nT = rect.height - nH;
        }
      }

      if (nH < minHeightPx) {
        nH = minHeightPx;
        nW = nH / heightMultiplier;
        // Re-constrain position if needed
        if (nL + nW > rect.width) {
          nL = rect.width - nW;
        }
        if (nT + nH > rect.height) {
          nT = rect.height - nH;
        }
      }

      // Final position clamping
      nL = Math.max(0, Math.min(nL, rect.width - nW));
      nT = Math.max(0, Math.min(nT, rect.height - nH));

      if (nW > 0 && nH > 0) {
        newBoxPx = { left: nL, top: nT, width: nW, height: nH };
      }
    }

    // Convert back to percentages
    const newBoxPercent = {
      left: (newBoxPx.left / rect.width) * 100,
      top: (newBoxPx.top / rect.height) * 100,
      width: (newBoxPx.width / rect.width) * 100,
      height: (newBoxPx.height / rect.height) * 100,
    };

    setCropBox(newBoxPercent);
  };

  const handleMouseUp = () => {
    setIsDraggingCropBox(false);
    setActiveCropBoxHandle();
    setIsComparing(false);
  };

  const getResultDataUrl = () => {
    if (!imgRef) {
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    canvas.width = imgRef.naturalWidth;
    canvas.height = imgRef.naturalHeight;

    if (shouldApplyFilter()) {
      ctx.filter = 'url(#masterFilter)';
    }
    ctx.drawImage(imgRef, 0, 0);

    return canvas.toDataURL();
  };

  const handleDownload = async () => {
    const url = getResultDataUrl();
    if (!url) {
      return;
    }

    if (!filename()) {
      return;
    }

    const downloader = new JsFileDownloader({
      url,
      autoStart: false,
      nativeFallbackOnError: true,
      filename: `${stripCommonExtension(filename()!)}.png`,
    });

    try {
      await downloader.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : error ? error.toString() : 'Failed to download';
      addToast(message);
    }
  };

  const handleResetZoomAndPan = () => {
    setIsResettingZoomAndPan(true);
    panzoom?.reset({ animate: true });
    setTimeout(() => setIsResettingZoomAndPan(false), PANZOOM_DURATION);
  };

  const handlePanzoomWheel = (event: WheelEvent) => {
    if (isResettingZoomAndPan()) {
      event.preventDefault();
      return;
    }

    panzoom?.zoomWithWheel(event);
  };

  const handlePanzoomChange = (event: Event) => {
    const { x, y, scale } = 'detail' in event ? (event.detail as panzoom.PanzoomEventDetail) : {};

    if (isPanApplied() && scale === 1 && !isResettingZoomAndPan()) {
      handleResetZoomAndPan();
    }

    setZoom(scale ?? 1);
    setIsPanApplied(x !== 0 || y !== 0);
  };

  const handlePanzoomZoom = (event: Event) => {
    const { scale } = 'detail' in event ? (event.detail as panzoom.PanzoomEventDetail) : {};

    setZoom(scale ?? 1);
  };

  const handleZoomInput = (value: number) => {
    panzoom?.zoom(value);
  };

  const handleCropRatioChange = (value: PostAspectRatio | undefined) => {
    setCropRatio(value);
    setupCropFrame(value);
  };

  const handleImageLoad = () => {
    if (hasLoadingError() || isApplyingCrop()) {
      return;
    }

    setIsCropApplied(false);
    setCropRatio(undefined);
  };

  const handleImageError = () => {
    if (hasLoadingError()) {
      return;
    }

    addToast(`Failed to load image: ${currentUrl()}`);
    setCurrentUrl(YellowExclamationMark);
  };

  const ref: ImageEditorRef = {
    getResultDataUrl,
    hasChanges,
  };

  createEffect(() => {
    const url = props.url;
    if (url) {
      setOriginalUrl(url);
      setCurrentUrl(url);
    }
  });

  // Clean up object URLs
  onCleanup(() => {
    const url = originalUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }

    const current = currentUrl();
    if (current && current !== url) {
      URL.revokeObjectURL(current);
    }
  });

  onMount(() => {
    props.ref?.(ref);

    // Add global event listeners for both mouse and touch
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);

    if (containerRef) {
      panzoom = Panzoom(containerRef, {
        maxScale: 5,
        minScale: 1,
        duration: PANZOOM_DURATION,
      });

      containerRef.addEventListener('panzoomchange', handlePanzoomChange);
      containerRef.addEventListener('panzoomzoom', handlePanzoomZoom);
      containerRef.parentElement?.addEventListener('wheel', handlePanzoomWheel);
    }

    onCleanup(() => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);

      if (panzoom) {
        containerRef?.removeEventListener('panzoomchange', handlePanzoomChange);
        containerRef?.removeEventListener('panzoomzoom', handlePanzoomZoom);
        containerRef?.parentElement?.removeEventListener('wheel', panzoom.zoomWithWheel);
      }
    });
  });

  return (
    <div class={styles.editor}>
      {/* SVG Filters */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="masterFilter" color-interpolation-filters="sRGB">
          <feComponentTransfer result="base">
            <feFuncR type="linear" slope={exposureContrastSlope()} intercept={exposureContrastIntercept()} />
            <feFuncG type="linear" slope={exposureContrastSlope()} intercept={exposureContrastIntercept()} />
            <feFuncB type="linear" slope={exposureContrastSlope()} intercept={exposureContrastIntercept()} />
          </feComponentTransfer>

          <feComponentTransfer in="base" result="with_brightness">
            <feFuncR type="linear" slope="1" intercept={brightness()} />
            <feFuncG type="linear" slope="1" intercept={brightness()} />
            <feFuncB type="linear" slope="1" intercept={brightness()} />
          </feComponentTransfer>

          <feColorMatrix in="with_brightness" type="luminanceToAlpha" result="shadow_mask_alpha" />
          <feComponentTransfer in="shadow_mask_alpha" result="shadow_mask">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>

          <feComponentTransfer in="with_brightness" result="shadow_brightened">
            <feFuncR type="linear" slope={shadowsSlope()} />
            <feFuncG type="linear" slope={shadowsSlope()} />
            <feFuncB type="linear" slope={shadowsSlope()} />
          </feComponentTransfer>

          <feComposite in="shadow_brightened" in2="shadow_mask" operator="in" result="shadow_fix" />
          <feComposite in="shadow_fix" in2="with_brightness" operator="over" result="after_shadows" />

          <feColorMatrix in="after_shadows" type="luminanceToAlpha" result="highlights_mask_alpha" />
          <feComponentTransfer in="highlights_mask_alpha" result="highlights_mask">
            <feFuncA type="table" tableValues="0 1" />
          </feComponentTransfer>

          <feComponentTransfer in="after_shadows" result="highlights_darkened">
            <feFuncR type="linear" slope={highlightsSlope()} />
            <feFuncG type="linear" slope={highlightsSlope()} />
            <feFuncB type="linear" slope={highlightsSlope()} />
          </feComponentTransfer>

          <feComposite in="highlights_darkened" in2="highlights_mask" operator="in" result="highlights_fix" />
          <feComposite in="highlights_fix" in2="after_shadows" operator="over" result="tones_fixed" />

          <feColorMatrix type="saturate" values={saturation().toString()} />
        </filter>
      </svg>

      <Frame class={styles.tools}>
        <Label label={`Exposure (${exposure().toFixed(2)})`} vertical active>
          <Slider
            min={0.2}
            max={3}
            step={0.01}
            value={exposure()}
            onChange={setExposure}
            minLabel="Dark"
            maxLabel="Bright"
          />
        </Label>

        <Label label={`Brightness (${brightness().toFixed(2)})`} vertical active>
          <Slider
            min={-0.5}
            max={0.5}
            step={0.01}
            value={brightness()}
            onChange={setBrightness}
            minLabel="Darker"
            maxLabel="Brighter"
          />
        </Label>

        <Label label={`Contrast (${contrast().toFixed(2)})`} vertical active>
          <Slider
            min={0.5}
            max={2}
            step={0.01}
            value={contrast()}
            onChange={setContrast}
            minLabel="Softer"
            maxLabel="Stronger"
          />
        </Label>

        <Label label={`Shadows (${shadows().toFixed(2)})`} vertical active>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={shadows()}
            onChange={setShadows}
            minLabel="Darker"
            maxLabel="Brighter"
          />
        </Label>

        <Label label={`Highlights (${highlights().toFixed(2)})`} vertical active>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={highlights()}
            onChange={setHighlights}
            minLabel="Brighter"
            maxLabel="Darker"
          />
        </Label>

        <Label label={`Saturation (${saturation().toFixed(2)})`} vertical active>
          <Slider
            min={0}
            max={3}
            step={0.01}
            value={saturation()}
            onChange={setSaturation}
            minLabel="B&W"
            maxLabel="Vibrant"
          />
        </Label>

        <div class={styles.toolbar}>
          <Button onMouseDown={handleCompareStart} onTouchStart={handleCompareStart}>
            Compare
          </Button>
          <Button onClick={resetFilters}>Reset</Button>
        </div>

        <Divider class={styles.divider} />

        <Label label="Crop" vertical active>
          <Show when={!isCropApplied()} fallback={aspectRatioToReadableText(cropRatio())}>
            <RadioGroup
              options={cropOptions()}
              name="ratio"
              value={cropRatio()}
              onChange={handleCropRatioChange}
              class={styles.radioGroup}
            />
          </Show>
        </Label>

        <Show when={isCropApplied()}>
          <div class={styles.toolbar}>
            <Button onClick={handleChangeCrop}>Change</Button>
          </div>
        </Show>

        <Divider class={styles.divider} />

        <Label label={`Zoom (x${zoom().toFixed(1)})`} vertical active>
          <Slider
            min={1}
            max={5}
            step={0.1}
            value={zoom()}
            onChange={handleZoomInput}
            minLabel="x1.0"
            maxLabel="x5.0"
          />
        </Label>

        <div class={styles.toolbar}>
          <Button onClick={handleResetZoomAndPan}>Reset</Button>
        </div>
      </Frame>

      <Frame class={styles.workspace}>
        <Show when={filename()}>
          <div class={styles.header}>
            <p class={styles.imageName}>
              {filename()}
              {hasChanges() ? '*' : ''}
            </p>
          </div>
        </Show>

        <div class={styles.actions}>
          <Show
            when={cropRatio() && !isCropApplied() && !hasLoadingError()}
            fallback={
              <Show when={!props.url}>
                <Button
                  onClick={(e: Event) => {
                    e.preventDefault();
                    selectFiles(processUploadFiles);
                  }}
                >
                  Select File
                </Button>
                <Show when={!props.url && currentUrl()}>
                  <Button onClick={handleDownload}>Download</Button>
                </Show>
              </Show>
            }
          >
            <Button onClick={applyCrop}>Apply</Button>
            <Button onClick={() => setCropRatio(undefined)}>Cancel</Button>
          </Show>
        </div>

        <div
          ref={containerRef}
          class={styles.imageContainer}
          style={{ display: originalUrl() ? 'inline-block' : 'none', position: 'relative' }}
        >
          <Show when={currentUrl()}>
            <img
              ref={imgRef}
              class={styles.mainImage}
              src={currentUrl()}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ filter: imageFilter() }}
            />
          </Show>

          <div
            ref={cropBoxRef}
            class={styles.cropBox}
            style={cropBoxStyle()}
            onMouseDown={handleCropStart}
            onTouchStart={handleCropStart}
          >
            {/* Grid lines */}
            <div class={clsx(styles.gridLine, styles.verticalLine)} style="left: 33.3%"></div>
            <div class={clsx(styles.gridLine, styles.verticalLine)} style="left: 66.6%"></div>
            <div class={clsx(styles.gridLine, styles.horizontalLine)} style="top: 33.3%"></div>
            <div class={clsx(styles.gridLine, styles.horizontalLine)} style="top: 66.6%"></div>

            {/* Corner handles (invisible but with cursor changes) */}
            <div class={clsx(styles.corner, styles.cornerNorthWest)} data-handle="nw"></div>
            <div class={clsx(styles.corner, styles.cornerNorthEast)} data-handle="ne"></div>
            <div class={clsx(styles.corner, styles.cornerSouthWest)} data-handle="sw"></div>
            <div class={clsx(styles.corner, styles.cornerSouthEast)} data-handle="se"></div>

            {/* Edge handles */}
            <div class={clsx(styles.edge, styles.edgeNorth)} data-handle="n"></div>
            <div class={clsx(styles.edge, styles.edgeSouth)} data-handle="s"></div>
            <div class={clsx(styles.edge, styles.edgeEast)} data-handle="e"></div>
            <div class={clsx(styles.edge, styles.edgeWest)} data-handle="w"></div>
          </div>
        </div>
      </Frame>
    </div>
  );
};
