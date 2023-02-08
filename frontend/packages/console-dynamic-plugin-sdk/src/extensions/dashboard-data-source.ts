import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type DataSource = ExtensionDeclaration<
  'console.datasource',
  {
    /** Returns a extension function that provides a custom data source object */
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
