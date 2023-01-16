import { useURLPoll } from '../utils/url-poll-hook';
import { getPluginURL, getPrometheusURL } from './helpers';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN } from '.';
import { PollProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

type UsePoll = (props: PollProps) => [any, unknown, boolean];

export const usePoll: UsePoll = ({
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
  let url;
  switch (dataSourceType) {
    case 'prometheus': {
      url = getPluginURL(
        { endpoint, endTime, namespace, query, samples, timeout, timespan },
        pluginBasePath,
        dataSourceType,
      );
      break;
    }
    default: {
      url = getPrometheusURL({ endpoint, endTime, namespace, query, samples, timeout, timespan });
      break;
    }
  }

  return useURLPoll(url, delay, query, timespan);
};
