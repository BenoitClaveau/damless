See NodeJS documentation HTTP/2

To generate the certificate and key for this example, run:

```shell
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout privkey.pem -out cert.pem
````