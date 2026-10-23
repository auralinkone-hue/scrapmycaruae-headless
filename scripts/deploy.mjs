import { spawnSync, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadDeployment, verifyDeploymentBuild } from './deployment-safety.mjs';

/** Injectable runner permits offline proof that failures cannot reach upload. */
export function runDeployment(environment, {
  env = process.env,
  check = () => loadDeployment(environment, env),
  verifyBuild = plan => verifyDeploymentBuild(plan, env),
  branch = () => execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  run = (command, args) => spawnSync(command, args, { env, stdio: 'inherit' })
} = {}) {
  if (branch() !== 'development') throw new Error('Deployment pathway requires development.');
  const initial = check(); // Fail before tests/build/upload when approval/config is absent.
  const execute = (command, args) => {
    const result = run(command, args);
    if (result.error || result.status !== 0) throw new Error('Deployment stopped: prerequisite command failed.');
  };
  execute('npm', ['test']);
  execute('npm', ['run', 'build']);
  const final = check();
  if (JSON.stringify(initial) !== JSON.stringify(final)) throw new Error('Deployment approval changed during build.');
  verifyBuild(final);
  execute(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--name', final.workerName, '--config', final.configFile]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3) throw new Error('One explicit environment required; deployment overrides are not accepted.');
  runDeployment(process.argv[2]);
}
