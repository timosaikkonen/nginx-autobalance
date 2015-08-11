# nginx-autobalance

A reverse proxy that pulls your backend nodes from your service discovery server (only Consul at this point, pull requests welcome) and drops dead/removed nodes automagically.

## Run

Pull the image:

```
docker pull timosaikkonen/nginx-autobalance
```

Run:

```
docker run timosaikkonen/nginx-autobalance \ 
	-e NGA_SERVICES_WEB_PATH=/ \
	-e NGA_SERVICES_WEB_UPSTREAMDIRECTIVE=ip_hash \
	-v /data/nginx/services:/etc/nginx/services \
	-v /data/nginx/cert:/etc/nginx/cert
```

### Configuration

This container uses a combination of environment variables and service-specific configuration files to configure the load balancer.

#### Environment variables


Variable                        | Description
--------------------------------|---------------------------
NGA_PORT                        | Port to listen to (default=80)
NGA_FORCESSL                    | If true, all non-SSL traffic will be redirected to SSL
NGA_SERVICES_service_PATH       | Root path for *service*
NGA_SERVICES_service_LBMODE     | Load balancing mode for service (ip_hash, least_conn). Defaults to round-robin.

