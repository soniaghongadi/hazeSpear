
cmd /c npx tsc

FOR /L %%A IN (1,1,10) DO (
  start cmd.exe /c node dist/starter.js
  timeout 3
)


