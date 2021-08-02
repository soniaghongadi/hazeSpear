var exec = require("child_process").exec;
const dockerProcess =
  "docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.8-management";
exec(dockerProcess, function callback(outs) {
  console.log(outs);
});
