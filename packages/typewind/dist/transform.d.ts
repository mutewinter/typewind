import { TransformerFn } from 'tailwindcss/types/config';

declare const transformBabel: (ext: string, content: string) => string;
declare const typewindTransforms: Record<string, TransformerFn>;

export { transformBabel, typewindTransforms };
