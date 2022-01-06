git ls-tree -r HEAD --name-only | grep -v ".ogg" | grep -v ".csv" | grep -v ".jpg" | grep -v "Pipfile.lock" | grep -v ".aup3" | grep -v ".m4a" | grep -v ".ico" | grep -v "package-lock" | xargs wc -l
