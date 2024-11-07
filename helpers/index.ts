export const parseStringToMD = (str: string) => str
  .replaceAll('  ', '')
  .replaceAll('.', '\\.')
  .replaceAll('+', '\\+')
  .replaceAll('-', '\\-');