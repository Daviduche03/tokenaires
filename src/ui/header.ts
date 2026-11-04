import { CLI_VERSION } from '@/config';
import { symbols, theme } from '@/ui/theme';

export function renderHeader(): string[] {
  return ['', `  ${theme.accent(symbols.logo)}  ${theme.strong('tokenaires')} ${theme.dim(`v${CLI_VERSION}`)}`, ''];
}
