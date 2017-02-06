const signatureRegExp = /^[^(]*\(([^)]*)\)/;
const commentRegExp = /\/\*[^]*?\*\//g;
const paramRegExp = /([^\s,{=]+)/;

export default function functionToParams(func: Function): string[] {
  const signature = func.toString()
    .replace(commentRegExp, '')
    .match(signatureRegExp);

  const params: string[] = [];
  const tokens = signature![1].split(',');

  for (const token of tokens) {
    const result = token.trim().match(paramRegExp);

    if (result) {
      params.push(result[1]);
    }
  }
  return params;
}
