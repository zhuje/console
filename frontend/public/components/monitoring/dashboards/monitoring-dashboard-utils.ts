import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { Board, MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY } from './types';
import { getQueryArgument } from '../../utils';
import { CustomDataSource } from '@console/dynamic-plugin-sdk/src/extensions/dashboard-data-source';

export const DEFAULT_GRAPH_SAMPLES = 60;

export const getActivePerspective = (namespace: string): string => (namespace ? 'dev' : 'admin');

export const getAllVariables = (boards: Board[], newBoardName: string, namespace: string) => {
  const data = _.find(boards, { name: newBoardName })?.data;

  const allVariables = {};
  _.each(data?.templating?.list, (v) => {
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

      allVariables[v.name] = ImmutableMap({
        includeAll: !!v.includeAll,
        isHidden: namespace && v.name === 'namespace' ? true : v.hide !== 0,
        isLoading: namespace ? v.type === 'query' && !namespace : v.type === 'query',
        options: _.map(v.options, 'value'),
        query: v.type === 'query' ? v.query : undefined,
        value: namespace && v.name === 'namespace' ? namespace : value || v.options?.[0]?.value,
      });
    }
  });

  return allVariables;
};

export const getAllVariablesTEST = async (
  boards: Board[],
  newBoardName: string,
  namespace: string,
  extensionFunction?: (dataSourceID: string) => Promise<CustomDataSource>,
) => {
  const data = _.find(boards, { name: newBoardName })?.data;

  const allVariables = {};
  // console.log("JZ getAllVariablesTEST() > (data?.templating?.list: ", JSON.stringify(data?.templating?.list, null, 2));

  if (!data?.templating?.list) {
    // console.log("JZ !data?.templating?.list is TRUE!!! O.o")
    return allVariables;
  }
  for (const v of data?.templating?.list) {
    // console.log("JZ monitoring-dashboard-utils inside LOOP >  v :", v  )

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
      // console.log("JZ getAllVariablesTEST() > dataSource: ", JSON.stringify(dataSource, null, 2));

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
  // console.log("JZ getAllVariablesTEST() > allVariables: ", JSON.stringify(allVariables, null, 2));
  return allVariables;
};

//   const testArray = data?.templating?.list?.map( async (v) => {
//     if (v.type === 'query' || v.type === 'interval') {
//       // Look for query param that is equal to the variable name
//       let value = getQueryArgument(v.name);

//       // Look for an option that should be selected by default
//       if (value === null) {
//         value = _.find(v.options, { selected: true })?.value;
//       }

//       // If no default option was found, default to "All" (if present)
//       if (value === undefined && v.includeAll) {
//         value = MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY;
//       }

//       const dataSource = (v?.datasource?.uid && extensionFunction) ? await extensionFunction(v.datasource.uid) : null;
//       console.log("JZ getAllVariablesTEST() > dataSource: ", JSON.stringify(dataSource, null, 2));

//       allVariables[v.name] = ImmutableMap({
//         dataSource: dataSource,
//         includeAll: !!v.includeAll,
//         isHidden: namespace && v.name === 'namespace' ? true : v.hide !== 0,
//         isLoading: namespace ? v.type === 'query' && !namespace : v.type === 'query',
//         options: _.map(v.options, 'value'),
//         query: v.type === 'query' ? v.query : undefined,
//         value: namespace && v.name === 'namespace' ? namespace : value || v.options?.[0]?.value,
//       });
//       return allVariables[v.name];
//     }
//   });
//   await Promise.all(testArray);
//   console.log("JZ getAllVariablesTEST() > allVariables: ", JSON.stringify(allVariables, null, 2));
//   return allVariables;
// };
