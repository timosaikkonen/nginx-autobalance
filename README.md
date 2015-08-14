# nginx-autobalance

A reverse proxy that pulls your backend nodes from your service discovery server (only Consul at this point, pull requests welcome) and drops dead/removed nodes automagically.

Very much work in progress. The configuration mechanism isn't quite settled yet and subject to change.

## Run

Pull the image:

```
docker pull timosaikkonen/nginx-autobalance
```

Run:

```
docker run timosaikkonen/nginx-autobalance \
  -p 80:80 -p 443:443 \
  -e NGA_SERVICES_WEB_PATH=/ \
  -e NGA_SERVICES_WEB_LBMODE=ip_hash \
  -v /data/nginx/services:/etc/nginx/services \
  -v /data/nginx/cert:/etc/nginx/ssl
```

### Configuration

This container uses a combination of environment variables and service-specific configuration files to configure the load balancer.

#### Environment variables


Variable                        | Description
--------------------------------|---------------------------
NGA_RELOADDELAY                 | Delay (in ms) before regenerating and reloading nginx configuration after changes have been made (default=5000)
NGA_SERVICES_service_PATH       | Root path for *service*
NGA_SERVICES_service_LBMODE     | Load balancing mode for service (`round_robin`, `ip_hash`, `least_conn`). Defaults to `round_robin`.

#### Configuration files

You need to provide service-specific nginx configuration files through a mounted volume or by `ADD`ing the files to `/etc/nginx/services`. The files must be named `<servicename>.conf`. The files will be included under the http directive and your upstream services have been declared as their respective service names.

The most basic example would look something like this:

```
location / {
  proxy_pass http://web;
}
```

To override All The Things, `ADD` a new `nginx.conf` to `/etc/nginx/nginx.conf`. Take a look at `nginx/nginx.conf` for a starting point.

#### SSL

Nginx will look for an SSL cert and key at `/etc/nginx/ssl/cert.crt` and `/etc/nginx/ssl/cert.key` respectively. The default configuration is based on [this](https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html "Strong SSL Security"):

```
ssl on;
ssl_certificate /etc/nginx/ssl/cert.crt;
ssl_certificate_key /etc/nginx/ssl/cert.key;
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
```

To override, `ADD` an ssl.conf file to `/etc/nginx/ssl.conf`.



