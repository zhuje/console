import { useURLPoll } from '../utils/url-poll-hook';
import { getPrometheusURL } from './helpers';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN, PrometheusResponse } from '.';
import { PrometheusPollProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import * as React from 'react';

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
  customDataSource,
}) => {
  const [url, setURL] = React.useState<string>();
  React.useEffect(() => {
    const prometheusURLProps = { endpoint, endTime, namespace, query, samples, timeout, timespan };
    setURL(
      customDataSource
        ? getPrometheusURL(prometheusURLProps, customDataSource.basePath)
        : getPrometheusURL(prometheusURLProps),
    );
  }, [customDataSource, endTime, endpoint, namespace, query, samples, timeout, timespan]);

  return useURLPoll<PrometheusResponse>(url, delay, query, timespan);
};
