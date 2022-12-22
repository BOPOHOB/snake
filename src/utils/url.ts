const URL_REGEXP = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const isUrl = (value: any): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  return !!value.match(URL_REGEXP);
};