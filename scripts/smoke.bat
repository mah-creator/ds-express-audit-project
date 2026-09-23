@echo off
setlocal
set BASE=http://127.0.0.1:3737

call :probe "unmatched route"      %BASE%/api/nothing
call :probe "missing auth"         %BASE%/api/appointments/patient
call :probe "garbage jwt"          %BASE%/api/appointments/patient -H "Authorization: Bearer garbage"
call :probe "zod empty body"       %BASE%/api/identity/register -X POST -H "Content-Type: application/json" -d "{}"
call :probe "bad json"             %BASE%/api/identity/register -X POST -H "Content-Type: application/json" -d "{oops"
call :probe "prisma unreachable"   %BASE%/api/clinics
call :probe "explicit NotFound"    %BASE%/api/clinics/does-not-exist
exit /b

:probe
set LABEL=%~1
shift
curl.exe -s -o NUL -w "%%{http_code} %%{content_type}\n" %*
echo    ^-^-^> %LABEL%
exit /b
