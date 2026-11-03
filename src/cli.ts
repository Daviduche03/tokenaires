import { createContext } from '@/context';
import { runCli } from '@/program';

const ctx = createContext();
process.exitCode = await runCli(ctx, process.argv.slice(2));
