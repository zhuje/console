import { useURLPoll } from '../utils/url-poll-hook';
import { getPluginURL, getPrometheusURL } from './helpers';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN, PrometheusResponse } from '.';
import { PrometheusPollProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

type UsePrometheusPoll = (props: PrometheusPollProps) => [PrometheusResponse, unknown, boolean];

export const usePrometheusPoll: UsePrometheusPoll = ({
  delay,
  endpoint,
  endTime,
  namespace,
  query,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
  pluginBasePath,
  dataSourceType,
}) => {
  const promtheusURLProps = { endpoint, endTime, namespace, query, samples, timeout, timespan };

  let url: string;
  switch (dataSourceType) {
    case 'prometheus': {
      url = getPluginURL(promtheusURLProps, pluginBasePath, dataSourceType);
      break;
    }
    default:
      url = getPrometheusURL(promtheusURLProps);
      break;
  }

  return useURLPoll<PrometheusResponse>(url, delay, query, timespan);
};
