let Http = new function() {

  const CORS_INDIRECTION = "https://cors-anywhere.herokuapp.com/"

  const DEFAULT_OPTIONS = Object.freeze({
    corsTrick: true,
    responseType: "json"
  })

  /**
  * Http request wrap around XMLHttpRequest
  * @param type GET / POST and such
  * @param url url targeted
  * @param params a string of params (url encoded for GET, json like for POST)
  * @param options response type and such
  */
  let httpRequest = function( type, url, params, options ) {

    params = params || ""
    options = options || DEFAULT_OPTIONS

    if( options.corsTrick && !url.startsWith( CORS_INDIRECTION )) {
      url = CORS_INDIRECTION + url

    }
    
    if( params ) {
      url += (params[0] == "?" ? "" : "?") + params
    }

    let xhr = new XMLHttpRequest()

    let onreadystatechange = ( e ) => {
      if( xhr.readyState !== XMLHttpRequest.DONE ) return

      if( xhr.status == 200 ) {
        const res = xhr.response;
        if( this.onSuccess ) this.onSuccess( res )
      } else {
        if( this.onError ) this.onError( res )
      }

    }

    /**
    * Subscribe to a request
    * @param onSuccess callback on success ( response ) => void
    * @param onError callback on error ( error ) => void
    */
    this.subscribe = function( onSuccess, onError ) {
      if( onSuccess ) this.onSuccess = onSuccess || (res => console.log)
      if( onError ) this.onError = onError || (res => console.error)

      xhr.open( type, url )
      xhr.responseType = options.responseType || this.defaultOptions.responseType
      xhr.onreadystatechange = onreadystatechange
      xhr.send( params )
    }
  }

  /**
  * Create a GET request
  */
  this.get = function( url, params, options ) {
    return new httpRequest( "GET", url, params, options )
  }

  /**
  * Create a post request
  */
  this.post = function( url, params, options ) {
    return new httpRequest( "POST", url, params, options )
  }

}
