<img align="right" src="@icon" height="150px" style=" border-radius: 8px;">

# @name

@desc

@links

# Running

## Docker

`docker run -d --name minecraft-server -p 25565:25565 -e EULA=true tricked/@slug`

### Compose

You can run the modpack with the following `docker-compose.yml` file

```yml
version: "3.8"

services:
  minecraft-server:
    image: tricked/@slug:latest
    container_name: @slug-server
    ports:
      - 25565:25565
    volumes:
      - ./data:/data
```

starting `docker-compose up -d` will start the server in the background keep in mind it can take several minutes to install and start.

## Info

modpack updated timestamp @date - id @id

## Repository

You can find the source code to this project here https://github.com/Tricked-dev/dockermc
