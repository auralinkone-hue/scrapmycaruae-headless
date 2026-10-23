import { loadDeployment, verifyDeploymentBuild } from './deployment-safety.mjs';
const [environment, flag, ...extra] = process.argv.slice(2);
if (extra.length || flag && flag !== '--built') throw new Error('Only an environment and optional --built are supported.');
const plan = loadDeployment(environment);
if (flag) verifyDeploymentBuild(plan);
console.log(`Verified ${plan.environment} target and configuration${flag ? ' including built output' : ''}.`);
