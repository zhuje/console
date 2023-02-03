import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { Board, MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY } from './types';
import { getQueryArgument } from '../../utils';
import { CustomDataSource } from '@console/dynamic-plugin-sdk/src/extensions/dashboard-data-source';

export const DEFAULT_GRAPH_SAMPLES = 60;

export const getActivePerspective = (namespace: string): string => (namespace ? 'dev' : 'admin');

export const getAllVariables = async (
  boards: Board[],
  newBoardName: string,
  namespace: string,
  extensionFunction?: (dataSourceID: string) => Promise<CustomDataSource>,
) => {
  const data = _.find(boards, { name: newBoardName })?.data;

  const allVariables = {};

  if (!data?.templating?.list) {
    return allVariables;
  }
  for (const v of data?.templating?.list) {
    if (v.type === 'query' || v.type === 'interval') {
      // Look for query param that is equal to the variable name
      let value = getQueryArgument(v.name);

      // Look for an option that should be selected by default
      if (value === null) {
        value = _.find(v.options, { selected: true })?.value;
      }

      // If no default option was found, default to "All" (if present)
      if (value === undefined && v.includeAll) {
        value = MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY;
      }

      const dataSource =
        v?.datasource?.uid && extensionFunction ? await extensionFunction(v.datasource.uid) : null;

      allVariables[v.name] = ImmutableMap({
        dataSource,
        includeAll: !!v.includeAll,
        isHidden: namespace && v.name === 'namespace' ? true : v.hide !== 0,
        isLoading: namespace ? v.type === 'query' && !namespace : v.type === 'query',
        options: _.map(v.options, 'value'),
        query: v.type === 'query' ? v.query : undefined,
        value: namespace && v.name === 'namespace' ? namespace : value || v.options?.[0]?.value,
      });
    }
  }
  return allVariables;
};
