# hazeSpear

A well thought fog simulator

It contains 3 parts

1. Fog
2. Cloud server
3. Sensor

All of the services are capable of being deployed individually to any physical or virtual machine.

| We rely on RabbitMQ to make a comms between all servies

# Installation 
```
1. yarn install 
2. yarn start
```

# Resetting RMQ between each run
1. Get the name of container 
`docker ps` it will print out a table, look for NAMES and copy it 
2. `docker exec -it <NAME> /bin/bash`
3. `rabbitmqctl stop_app && rabbitmqctl reset && rabbitmqctl start_app`