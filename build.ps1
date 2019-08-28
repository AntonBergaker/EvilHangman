Remove-Item -path out -Recurse
Copy-Item .\src out -Recurse -Exclude *.ts
tsc
ls out\*.ts -Recurse | foreach {rm $_}