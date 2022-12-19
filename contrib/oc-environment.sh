# shellcheck shell=bash
#
# This file is an example of how you might set up your environment to run the
# console against an OpenShift cluster during development. To use it for
# running bridge, do
#
# . contrib/oc-environment.sh
# ./bin/bridge
#
# You'll need oc, and you'll need to be logged into a cluster.
#
# The environment variables beginning with "BRIDGE_" act just like bridge
# command line arguments - in fact. to get more information about any of them,
# you can run ./bin/bridge --help

BRIDGE_USER_AUTH="disabled"
export BRIDGE_USER_AUTH

BRIDGE_K8S_MODE="off-cluster"
export BRIDGE_K8S_MODE

BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT=$(oc whoami --show-server)
export BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT

BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS=true
export BRIDGE_K8S_MODE_OFF_CLUSTER_SKIP_VERIFY_TLS

BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}')
export BRIDGE_K8S_MODE_OFF_CLUSTER_THANOS

BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER=$(oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}')
export BRIDGE_K8S_MODE_OFF_CLUSTER_ALERTMANAGER

GITOPS_HOSTNAME=$(oc -n openshift-gitops get route cluster -o jsonpath='{.spec.host}' 2> /dev/null)
if [ -n "$GITOPS_HOSTNAME" ]; then
    BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS="https://$GITOPS_HOSTNAME"
    export BRIDGE_K8S_MODE_OFF_CLUSTER_GITOPS
fi

BRIDGE_K8S_AUTH="bearer-token"
export BRIDGE_K8S_AUTH

BRIDGE_K8S_AUTH_BEARER_TOKEN=$(oc whoami --show-token)
export BRIDGE_K8S_AUTH_BEARER_TOKEN

BRIDGE_USER_SETTINGS_LOCATION="localstorage"
export BRIDGE_USER_SETTINGS_LOCATION

# This is a workaround for local setup where Helm CLI has been setup with helm repositories
HELM_REPOSITORY_CONFIG="/tmp/repositories.yaml"
export HELM_REPOSITORY_CONFIG

echo "Using $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"


# JZ NOTE: test dashboard plugin -- for the console to know about the plugin you can add
CONSOLE_IMAGE=${CONSOLE_IMAGE:="quay.io/openshift/origin-console:latest"}
export CONSOLE_IMAGE
CONSOLE_PORT=${CONSOLE_PORT:=9000}
export CONSOLE_PORT
PLUGIN_PROXY='{"services": [{"consoleAPIPath": "/api/proxy/plugin/dashboards-datasource-plugin/backend/", "authorize": true, "endpoint": "http://localhost:9000/api/kubernetes/api/v1/"}]}'
export PLUGIN_PROXY

echo "API Server: $BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT"
echo "Console Image: $CONSOLE_IMAGE"
echo "Console URL: http://localhost:${CONSOLE_PORT}"
echo "Plugin proxy: ${PLUGIN_PROXY}"

# Prefer podman if installed. Otherwise, fall back to docker.
if [ -x "$(command -v podman)" ]; then
    if [ "$(uname -s)" = "Linux" ]; then
        # Use host networking on Linux since host.containers.internal is unreachable in some environments.
        BRIDGE_PLUGINS="${npm_package_consolePlugin_name}=http://localhost:9001"
        podman run --pull always --rm --network=host --env-file <(set | grep BRIDGE) --env BRIDGE_PLUGIN_PROXY="${PLUGIN_PROXY}" $CONSOLE_IMAGE
    else
        BRIDGE_PLUGINS="${npm_package_consolePlugin_name}=http://host.containers.internal:9001"
        podman run --pull always --rm -p "$CONSOLE_PORT":9000 --env-file <(set | grep BRIDGE) --env BRIDGE_PLUGIN_PROXY="${PLUGIN_PROXY}" $CONSOLE_IMAGE
    fi
else
    BRIDGE_PLUGINS="${npm_package_consolePlugin_name}=http://host.docker.internal:9001"
    docker run --pull always --rm -p "$CONSOLE_PORT":9000 --env-file <(set | grep BRIDGE) --env BRIDGE_PLUGIN_PROXY="${PLUGIN_PROXY}" $CONSOLE_IMAGE
fi
