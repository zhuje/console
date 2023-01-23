import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type DataSource = ExtensionDeclaration<
  'console.datasource',
  {
    /** The data source identifier. */
    datasourceID: string;
    /** The plugin path. */
    path: string;
    /** Returns extension functions that provide custom data source URLs. */
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
