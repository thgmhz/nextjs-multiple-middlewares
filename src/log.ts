import * as colors from 'ansis/colors';

const canConsole = ['development', 'test'].includes(process.env.NODE_ENV);

const title = `- ${colors.magenta('middleware')}`;

const logMsg = (subtitle: string) => (str: string) => {
  if (!canConsole) return;

  console.log(`${title} ${subtitle} ${str}`);
};

export const log = {
  error: logMsg(colors.red('error')),
  info: logMsg(colors.blue('info')),
  warn: logMsg(colors.yellow('warning')),
  colors,
};
