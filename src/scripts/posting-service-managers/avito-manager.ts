import 'dotenv/config';
import type { Post, PostEntry } from '../../core/entities/post.ts';
import type { Publication, PublicationComment } from '../../core/entities/publication.ts';
import type { PostingServiceManager } from '../../core/entities/service.ts';
import type { UserProfile } from '../../core/entities/user.ts';
import { USER_DEFAULT_AUTHOR, USER_UNKNOWN } from '../../core/entities/user.ts';
import { Avito } from '../../core/services/avito.ts';
import { users } from '../data-managers/users.ts';

const AVITO_API_URL = 'https://api.avito.ru';
const AVITO_REVIEWS_LIMIT = 50;

export interface AvitoReviewAnswer {
  text: string;
  status: string;
  createdAt: number;
}

export interface AvitoReviewItem {
  id: number | string;
  title?: string;
}

export interface AvitoReviewSender {
  name?: string;
}

export interface AvitoReview {
  id: number;
  score: number;
  createdAt: number;
  text: string;
  item?: AvitoReviewItem | null;
  sender?: AvitoReviewSender | null;
  answer?: AvitoReviewAnswer | null;
}

interface AvitoReviewsResponse {
  total: number;
  reviews: AvitoReview[];
}

export type AvitoReviewAuthorResolver = (review: AvitoReview) => Promise<string>;

export function createReviewAuthorProfile(review: AvitoReview, service: string): UserProfile | undefined {
  const name = review.sender?.name?.trim();

  return name
    ? {
        service,
        id: String(review.id),
        name,
      }
    : undefined;
}

export async function createReviewComments(
  reviews: AvitoReview[],
  itemId: number | string,
  resolveAuthor: AvitoReviewAuthorResolver,
): Promise<PublicationComment[]> {
  const id = String(itemId);
  const comments: PublicationComment[] = [];

  for (const review of reviews
    .filter((review) => review.item && String(review.item.id) === id)
    .sort((a, b) => a.createdAt - b.createdAt)) {
    const text = review.text.trim();
    const score = review.score >= 1 && review.score <= 5 ? review.score : undefined;
    const answer = review.answer;
    const author = await resolveAuthor(review);
    const replies =
      answer && answer.status === 'published' && answer.text.trim()
        ? [
            {
              datetime: new Date(answer.createdAt * 1000),
              author: USER_DEFAULT_AUTHOR,
              text: answer.text.trim(),
            },
          ]
        : undefined;

    comments.push({
      datetime: new Date(review.createdAt * 1000),
      author,
      text,
      ...(score !== undefined ? { score } : {}),
      ...(replies ? { replies } : {}),
    });
  }

  return comments;
}

export class AvitoManager extends Avito implements PostingServiceManager {
  private accessToken: string | undefined;

  async connect() {
    const accessToken = await this.getAccessToken();

    return { accessToken };
  }

  async disconnect() {
    this.accessToken = undefined;
  }

  async grabFollowerCount() {
    return undefined;
  }

  async grabPosts(_afterPublication?: Publication): Promise<Post[]> {
    return [];
  }

  async publishPostEntry(_entry: PostEntry): Promise<void> {
    throw new Error(`Cannot publish post to ${this.name}`);
  }

  async updatePublication(publication: Publication) {
    if (!this.isPublication(publication)) {
      return;
    }

    const reviews = await this.grabReviews();
    const comments = await createReviewComments(reviews, publication.id, (review) => this.getReviewAuthor(review));

    await users.save();

    publication.comments = comments.length > 0 ? comments : undefined;
    publication.updated = new Date();
  }

  private async getReviewAuthor(review: AvitoReview) {
    const profile = createReviewAuthorProfile(review, this.id);
    const name = review.sender?.name?.trim();

    if (!profile || !name) {
      return USER_UNKNOWN;
    }

    const [author] = await users.findOrAddItemByProfile(profile, (profile) => {
      profile.name = name;
      profile.updated = new Date();
    });

    return author;
  }

  private async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    const { AVITO_CLIENT_ID, AVITO_CLIENT_SECRET } = process.env;

    if (!AVITO_CLIENT_ID) {
      throw new Error(`Need ${this.name} client id`);
    }

    if (!AVITO_CLIENT_SECRET) {
      throw new Error(`Need ${this.name} client secret`);
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AVITO_CLIENT_ID,
      client_secret: AVITO_CLIENT_SECRET,
    });

    const response = await fetch(`${AVITO_API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to get ${this.name} access token: ${response.status} ${await response.text()}`.trim());
    }

    const data = (await response.json()) as { access_token?: string };

    if (!data.access_token) {
      throw new Error(`Failed to get ${this.name} access token`);
    }

    this.accessToken = data.access_token;

    return this.accessToken;
  }

  private async request<T>(path: string): Promise<T> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${AVITO_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to request ${this.name} API "${path}": ${response.status} ${await response.text()}`.trim(),
      );
    }

    return (await response.json()) as T;
  }

  private async grabReviews() {
    const reviews: AvitoReview[] = [];
    let offset = 0;

    for (;;) {
      const query = new URLSearchParams({
        offset: String(offset),
        limit: String(AVITO_REVIEWS_LIMIT),
      });
      const response = await this.request<AvitoReviewsResponse>(`/ratings/v1/reviews?${query}`);

      reviews.push(...response.reviews);
      offset += response.reviews.length;

      if (offset >= response.total || response.reviews.length === 0) {
        break;
      }
    }

    return reviews;
  }
}

export const avitoManager = new AvitoManager();
