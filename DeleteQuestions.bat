for /L %%i in (1986,1,1996) do (
  curl --user eric.hue@web.de:SecretAmazingPW!1! -X DELETE  https://idefix.informatik.htw-dresden.de:8888/api/quizzes/%%i?force=true
)
pause