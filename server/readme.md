# INSTRUKCJA KORZYSTANIA Z PYTHONOWEGO BACKENDU

⚠️ UWAGA! Komenda `python` może inaczej wyglądać na różnych systemach ze wzg. na różne sposoby instalacji. Zamiast `python` może to być `python3`, `py`, lub inne. Weryfikujemy to komendą `python/python3/py --version`
### INICIALIZACJA VENV
🚨 TEN KROK JEST **NIEZBĘDNY** DO PRAWIDŁOWEGO KORZYSTANIA ZE ŚRODOWISKA PRACY
* Po wejściu w folder z `main.py` należy wpisać `python -m venv venv`
* Aktywujemy środowisko wirtualne venv w terminalu
	* na MacOS: `source venv/bin/activate`
	* na Windows: `venv\Scripts\activate`
		* czasami najpierw trzeba wejść w `cd venv\scripts` i osobno wpisać `activate`
* Jeżeli wszystko poszło poprawnie, w terminalu powinniśmy zobaczyć `(venv)` przed wpisywaną komendą
### INSTALACJA MODUŁÓW
* Upewniamy się że jesteśmy w folderze z `main.py` oraz aktywowany został `(venv)`
* Jeśli istnieje plik `requirements.txt`, instalujemy go za pomocą `pip install -r requirements.txt`
*  Pojedyncze moduły instalujemy `pip install <nazwa_modułu>`
* Po dodaniu jakiś modułów, aktualizujemy `requirements.txt` za pomocą `pip freeze > requirements.txt`
### INTEGRACJA Z GITHUB
* 🛑 `venv` oraz jego zawartości **NIGDY** nie pushujemy do origina
* ✅ `requirements.txt` pushujemy, żeby wszyscy pracowali na tych samych modułach