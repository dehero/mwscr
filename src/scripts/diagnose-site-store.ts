import 'dotenv/config';
import { lookup } from 'node:dns/promises';
import { connect } from 'node:net';
import ssh2 from 'ssh2';
import SFTPClient from 'ssh2-sftp-client';

const { Client, utils } = ssh2;

const CONNECT_TIMEOUT = 20000;
const DEBUG_PATTERN = /auth|subsystem|fail|error|denied|refused|timeout|algorithm|kex|handshake/i;
const DEBUG_LIMIT = 80;

interface SiteConfig {
  host: string;
  port: number;
  username: string;
  privateKey: string;
  storePath: string;
}

interface ProbeResult {
  ssh: string;
  sftp: string;
}

const debugLines: string[] = [];

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

function log(label: string, value: unknown) {
  console.log(`${label}: ${String(value)}`);
}

function flushDebug() {
  const lines = debugLines.filter((line) => DEBUG_PATTERN.test(line)).slice(-DEBUG_LIMIT);
  debugLines.length = 0;
  if (lines.length === 0) {
    return;
  }
  console.log('--- ssh2 debug ---');
  for (const line of lines) {
    console.log(line);
  }
}

function normalizeKey(key: string) {
  return `${key.replace(/\r\n?/g, '\n').trim()}\n`;
}

function describeKey(label: string, key: string) {
  section(label);
  log('length', key.length);
  log('lines', key.split('\n').length);
  log('carriage returns', (key.match(/\r/g) ?? []).length);
  log('ends with newline', key.endsWith('\n'));
  log('first line', JSON.stringify(key.split('\n')[0]));
  log('last line', JSON.stringify(key.split('\n').slice(-1)[0]));
  log('encrypted', /ENCRYPTED|Proc-Type: 4,ENCRYPTED/.test(key));

  const parsed = utils.parseKey(key);
  if (parsed instanceof Error) {
    log('parseKey', `error: ${parsed.message}`);
  } else if (Array.isArray(parsed)) {
    log('parseKey', `ok: ${parsed.length} keys`);
  } else {
    log('parseKey', `ok: type ${parsed.type}`);
  }
}

async function resolveHost(host: string) {
  section('DNS');
  try {
    const addresses = await lookup(host, { all: true });
    for (const address of addresses) {
      log('address', `${address.address} (IPv${address.family})`);
    }
  } catch (error) {
    log('dns error', error instanceof Error ? error.message : error);
  }
}

function probeTcp(host: string, port: number) {
  section('TCP probe');
  return new Promise<void>((resolve) => {
    const started = Date.now();
    const socket = connect({ host, port });
    const finish = (message: string) => {
      console.log(`tcp ${host}:${port} -> ${message} (${Date.now() - started}ms)`);
      socket.destroy();
      resolve();
    };

    socket.setTimeout(CONNECT_TIMEOUT);
    socket.once('connect', () => finish('connected'));
    socket.once('timeout', () => finish('timeout'));
    socket.once('error', (error: NodeJS.ErrnoException) => finish(`error ${error.code ?? error.message}`));
  });
}

function sshExec(config: SiteConfig, key: string) {
  section('SSH exec probe');
  return new Promise<string>((resolve) => {
    const client = new Client();
    let timer: NodeJS.Timeout | undefined;
    let settled = false;

    const finish = (message: string) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      console.log(`ssh exec -> ${message}`);
      flushDebug();
      client.end();
      resolve(message);
    };

    timer = setTimeout(() => finish('timeout'), CONNECT_TIMEOUT);

    client.on('ready', () => {
      client.exec('echo ssh-exec-ok', (error, stream) => {
        if (error) {
          finish(`error: ${error.message}`);
          return;
        }

        let output = '';
        stream.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });
        stream.on('close', () => finish(`output ${JSON.stringify(output.trim() || '(empty)')}`));
      });
    });

    client.on('error', (error: Error) => finish(`error: ${error.message}`));

    client.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      privateKey: key,
      readyTimeout: CONNECT_TIMEOUT,
      debug: (message: string) => debugLines.push(message),
    });
  });
}

async function sftpProbe(config: SiteConfig, key: string) {
  section('SFTP probe');
  const client = new SFTPClient();
  let result: string;

  try {
    await client.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      privateKey: key,
      readyTimeout: CONNECT_TIMEOUT,
      debug: (message: string) => debugLines.push(message),
    });

    const list = await client.list(config.storePath);
    result = `ok: ${list.length} entries in ${config.storePath}`;
  } catch (error) {
    result = `error: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    await client.end().catch(() => undefined);
  }

  console.log(`sftp -> ${result}`);
  flushDebug();

  return result;
}

async function runVariant(config: SiteConfig, name: string, key: string): Promise<ProbeResult> {
  describeKey(name, key);
  const ssh = await sshExec(config, key);
  const sftp = await sftpProbe(config, key);

  return { ssh, sftp };
}

function verdict(raw: ProbeResult, normalized: ProbeResult) {
  section('VERDICT');

  if (raw.sftp.startsWith('ok')) {
    console.log('SFTP connection works with the secret as stored. The failure is elsewhere (path, permissions, or a later operation).');
    return;
  }

  if (normalized.sftp.startsWith('ok')) {
    console.log(
      'Key format issue: the secret as stored is rejected by ssh2, while the normalized key works. Strip line breaks normalization in site-store-manager.ts: use privateKey.replace(/\\r\\n?/g, "\\n").trim() + "\\n".',
    );
    return;
  }

  if (normalized.ssh.startsWith('output') && !normalized.sftp.startsWith('ok')) {
    console.log(
      'SSH works but SFTP does not: the SFTP subsystem or the store path is unavailable for this user. ssh-deploy uses rsync over SSH, not SFTP, so deploy keeps working.',
    );
    return;
  }

  if (normalized.ssh === 'timeout' || normalized.ssh.includes('ETIMEDOUT') || normalized.ssh.includes('ENETUNREACH')) {
    console.log('Network issue: the runner cannot reach the host (check DNS/IPv6, firewall allow-list for GitHub-hosted runner IPs, port).');
    return;
  }

  if (!normalized.ssh.startsWith('output')) {
    console.log('SSH itself fails from the GitHub-hosted runner: check authentication, key permissions, and the account restrictions.');
    return;
  }

  console.log('Inconclusive, see the logs above.');
}

const host = process.env.SITE_SSH_HOST;
const username = process.env.SITE_SSH_USER;
const privateKey = process.env.SITE_SSH_PRIVATE_KEY;
const storePath = process.env.SITE_SSH_STORE_PATH;

if (!host || !username || !privateKey || !storePath) {
  const missing = ['SITE_SSH_HOST', 'SITE_SSH_USER', 'SITE_SSH_PRIVATE_KEY', 'SITE_SSH_STORE_PATH'].filter(
    (name) => !process.env[name],
  );
  console.log(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const config: SiteConfig = {
  host,
  port: Number(process.env.SITE_SSH_PORT ?? 22),
  username,
  privateKey,
  storePath,
};

section('Environment');
log('host', config.host);
log('port', config.port);
log('user', config.username);
log('store path', config.storePath);

await resolveHost(config.host);
await probeTcp(config.host, config.port);

const rawResult = await runVariant(config, 'Raw private key (as stored in the secret)', config.privateKey);
const normalizedResult = await runVariant(
  config,
  'Normalized private key (CRLF stripped, trailing newline added)',
  normalizeKey(config.privateKey),
);

verdict(rawResult, normalizedResult);
