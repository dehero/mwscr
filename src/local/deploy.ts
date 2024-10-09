import 'dotenv/config';
import { deploySite } from './functions/deploy-site.js';

await deploySite();
