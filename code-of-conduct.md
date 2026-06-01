### Oficjalna tablica Trello
https://trello.com/b/kCeUSm0f/typing-app

### Zasady korzystania z repozytorium git
* Główny branch to `master` do którego **NIGDY** nie pushujemy bezpośrednio
* Wszystkie zmiany znajdują się na `dev` a następnie są pushowane do `master` za pomocą Pull Request.
* Hierarchia branchy: `master << dev << feature/fix/refactor/<nazwa>`
* Branche `feature/fix/refactor` można edytować do woli, po skończeniu pracy mergujemy z `dev` albo za pomocą `git merge <nazwa_brancha>` albo tworzymy PR (zalecane, szczególnie dla większych zmian)
* Drobne zmiany możemy pushować prosto do `dev` ale jest to odradzane.