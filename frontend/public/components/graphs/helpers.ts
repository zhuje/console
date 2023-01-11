import * as _ from 'lodash-es';
import {
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from './index';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
export { PrometheusEndpoint };

// Range vector queries require end, start, and step search params
const getRangeVectorSearchParams = (
  endTime: number = Date.now(),
  samples: number = DEFAULT_PROMETHEUS_SAMPLES,
  timespan: number = DEFAULT_PROMETHEUS_TIMESPAN,
): URLSearchParams => {
  const params = new URLSearchParams();
  params.append('start', `${(endTime - timespan) / 1000}`);
  params.append('end', `${endTime / 1000}`);
  params.append('step', `${timespan / samples / 1000}`);
  return params;
};

export const getSearchParams = ({
  endpoint,
  endTime,
  timespan,
  samples,
  ...params
}: PrometheusURLProps): URLSearchParams => {
  const searchParams =
    endpoint === PrometheusEndpoint.QUERY_RANGE
      ? getRangeVectorSearchParams(endTime, samples, timespan)
      : new URLSearchParams();
  _.each(params, (value, key) => value && searchParams.append(key, value.toString()));
  return searchParams;
};

const DASHBOARD_PLUGIN_BASE_PATH = '/api/proxy/plugin/dashboards-datasource-plugin';

export const getPrometheusURL = (
  props: PrometheusURLProps,
  basePath: string = props.namespace ? PROMETHEUS_TENANCY_BASE_PATH : PROMETHEUS_BASE_PATH,
  pluginProxyAlias?: string,
): string => {
  if (props.endpoint !== PrometheusEndpoint.RULES && !props.query) {
    return '';
  }
  const params = getSearchParams(props);

  if (pluginProxyAlias) {
    const endpoint = props.endpoint.substring(props.endpoint.lastIndexOf('/') + 1);
    return `${DASHBOARD_PLUGIN_BASE_PATH}/${pluginProxyAlias}/${endpoint}?${params.toString()}`;
  }
  return `${basePath}/${props.endpoint}?${params.toString()}`;
};

export const getPluginURL = (props, pluginBasePath, dataSourceType): string => {
  switch (dataSourceType) {
    case 'prometheus': {
      const params = getSearchParams(props);
      const endpoint = props.endpoint.substring(props.endpoint.lastIndexOf('/') + 1);
      return `${pluginBasePath}/${endpoint}?${params.toString()}`;
    }
    default:
      return '';
  }
};

// # getPrometheusURL
// http://localhost:9000/api/prometheus/api/v1/query?query=sum%28etcd_server_has_leader%7Bjob%3D%22etcd%22%7D%29
// ${basePath} = /api/prometheus
// ${props.endpoint} = /api/v1/query
// ?
// ${configMap.target.expr > index.tsx.queries > helpers.ts.PrometheusURLProps > params.toString} = query=sum%28etcd_server_has_leader%7Bjob%3D%22etcd%22%7D%29

// # prometheusProxyURL
// '/api/proxy/plugin/dashboards-datasource-plugin/backend/namespaces/openshift-kube-apiserver/pods?limit=250&cluster=local-cluster';
// basepath = '/api/proxy/plugin/dashboards-datasource-plugin/backend '
// ${props.endpoint} = PrometheusEndpoint.QUERY = 'api/v1/query',

// # oc-environment.sh
// BRIDGE_PLUGINS="dashboards-datasource-plugin=http://localhost:9001"
// export BRIDGE_PLUGINS
// PROXY_ENDPOINT="http://localhost:9000/api/prometheus/"
// export PROXY_ENDPOINT
// BRIDGE_PLUGIN_PROXY="{\"services\": [{\"consoleAPIPath\": \"/api/proxy/plugin/dashboards-datasource-plugin/backend/\", \"authorize\": true, \"endpoint\": \"${PROXY_ENDPOINT}\"}]}"
// export BRIDGE_PLUGIN_PROXY
//
//
// example
// http://localhost:9000/api/proxy/plugin/dashboards-datasource-plugin/backend/query_range?start=1672867370.476&end=1672869170.476&step=30&query=count%28etcd_server_has_leader%29+by+%28job%29&timeout=60s
// http://localhost:9000/api/prometheus/api/v1/query_range?start=1672867370.476&end=1672869170.476&step=30&query=count%28etcd_server_has_leader%29+by+%28job%29&timeout=60s
// plugin -- api/proxy/plugin/dashboards-datasource-plugin/backend
// default -- api/prometheus/api/v1

type PrometheusURLProps = {
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query?: string;
  proxy?: boolean;
  samples?: number;
  timeout?: string;
  timespan?: number;
  pluginProxyAlias?: string;
};
