import { deploy } from '@samkirkland/ftp-deploy';

export async function deploySite() {
  console.group('Deploying site...');

  try {
    const { SITE_FTP_HOST, SITE_FTP_USER, SITE_FTP_PASSWORD, SITE_FTP_PATH } = process.env;
    if (!SITE_FTP_HOST) {
      throw new Error('Need site FTP host');
    }

    if (!SITE_FTP_USER) {
      throw new Error('Need site FTP user');
    }

    if (!SITE_FTP_PASSWORD) {
      throw new Error('Need site FTP password');
    }

    if (!SITE_FTP_PATH) {
      throw new Error('Need site FTP path');
    }

    await deploy({
      server: SITE_FTP_HOST,
      username: SITE_FTP_USER,
      password: SITE_FTP_PASSWORD,
      'server-dir': SITE_FTP_PATH,
      'local-dir': './dist/client/',
      exclude: ['./store/**'],
      timeout: 60000,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error deploying site: ${error.message}`);
    }
  }

  console.groupEnd();
}
