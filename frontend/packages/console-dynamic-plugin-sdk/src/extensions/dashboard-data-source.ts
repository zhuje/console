import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type DataSource = ExtensionDeclaration<
  'console.datasource',
  {
    /** The data source identifier. */
    datasourceID: string;
    /** The plugin path. */
    path: string;
    component: CodeRef<() => string>;
    /** The extension function returns a object that facilitates fetching from a custom data source within Observe > Dashboard. */
    getDataSource: CodeRef<(dataSourceID: string) => CustomDataSource>;
  }
>;

export const isDataSource = (e: Extension): e is DataSource => {
  return e.type === 'console.datasource';
};

export type CustomDataSource = {
  basePath: string;
  dataSourceType: string;
};
