# How the data piepline works

- The user changes parameters -> new data needs to be loaded
- Timestmap is too old (threshold needed) -> new data needs to be loaded
- User can specify "getNEWdata" to refresh the cached data for these parameters
- every hour or so the cache is "filtered" -> too old data will get deleted
- A list of opened modules is gathered
  - The server requests data for ALL procedures and calculates ALL visual structures for ALL available modules
  - **BUT**
    - At first only data for opened modules is requested
    - The data will be parsed
  - **After that**
    - all open data requests will be done
    - and the data for not yet opened modules will be parsed
- **GENERAL**
  - procedures get called only once
  - all data (and parsed data) will be **_cached_**
  - if a modules is opened -> the data will be requested from the client to the server
    - the server already has the parsed data and sends it to the client!
- **FILTERS**
  - filters just filter the data on the client-side
- **IMPLEMENTATION**
  - what is needed?
    - cache, that caches raw data
    - cache, that caches parsed data
    - cache, that caches vis data
    - list of all procedures used in all modules (closed and open!)
    - list of all parse- und vis-functions for all modules (closed and open!)

# anderes

- Freeze Funktion -> Module beliebig oft öffnenbar -> können eingefroren werden = no data updates
- aber Problem: sie sind im Weg -> sie können gespeichert werden -> export der VISDATEN im Modul + Modulname -> Über Button kann gespeichertes Modul reingeladen werden = import
