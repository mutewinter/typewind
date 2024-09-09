import { PluginObj, PluginPass } from '@babel/core';

declare function headingBabelPlugin(): PluginObj<PluginPass & {
    classes: string[];
}>;

export { headingBabelPlugin as default };
