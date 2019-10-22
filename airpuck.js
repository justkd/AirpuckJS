/*
 *  Version 2.0
 *  10-18-2019
 *  Copyright 2019 justKD
 *  MIT License
 */

// go to airtable api  - https://airtable.com/api
// select the base you want to work with
// check show api key
// check the authentication section, and see something like:
//
// $ curl https://api.airtable.com/v0/appqAIFn2dZxGMIty/Table%201?api_key=keyRvIqOJ3I393sB3
// 
// in the example url above:
// Base ID = appqAIFn2dZxGMIty
// Table Name = able 1 (after removing the escaped space)
// Api Key = keyRvIqOJ3I393sB3

const Airpuck = {

    Table: class {
        /**
         * Initialization options that can be passed to the `Airpuck.Table()` constuctor.
         * @typedef {object} AirpuckTableOptions
         * @property {string} name - The table name exactly as it appears in Airtable.
         * @property {string} baseID - The ID of the intended base.
         * @property {string} apiKey - The appropriate API key.
         */

        /**
         * This reflects a specific table in an Airtable base.
         * @param {AirpuckTableOptions} options - An `AirpuckTableOptions` object or just the table name.`
         * @param {Function=} onReady - Callback function run after successful table initialization.
         * @details Will automatically attempt to identify all fields, but the Airtable API does not report empty fields. If no records
         * have zero empty fields, Airpuck will not be able to accurately identify all fields.
         */
        constructor(options, onReady) {

            /** Instance properties. */
            const _props = {
                options: {},
                fields: [],
                records: [],
                endpoint: '',
            }

            /** Instance state. */
            const _state = {
                ready: false,
            }

            /** Set parameters as properties. */
            const setOptions = (_ => {
                if (options) {
                    _props.options.name = options.name
                    _props.options.baseID = options.baseID
                    _props.options.apiKey = options.apiKey
                }
            })()

            /** Creates a record in Airtable format with known fields. */
            this.record = class {
                constructor() {
                    this.fields = {}
                    _props.fields.forEach(field => this.fields[field] = '')
                }
            }

            /** Helper class to simplify and consolidate XHR calls. */
            const XHR = class {
                /**
                 * Initialization options that can be passed to the `new XHR()` constructor.
                 * @typedef {object} SimpleXHROptions
                 * @property {string} endpoint
                 * @property {string=} bearer
                 */
                constructor() {

                    this.endpoint = _props.endpoint
                    this.bearer = _props.options.apiKey
                    this.status = null
                    this.response = null

                    const _request = (type, success, fail, send, recordID) => {
                        const xhr = new XMLHttpRequest()

                        if (recordID) xhr.open(type, this.endpoint + '/' + recordID)
                        else xhr.open(type, this.endpoint)

                        xhr.setRequestHeader('Content-Type', 'application/json')
                        if (this.bearer) xhr.setRequestHeader('Authorization', 'Bearer ' + this.bearer)

                        xhr.onload = _ => {
                            this.status = xhr.status
                            if (xhr.status === 200) {
                                this.response = JSON.parse(xhr.response)
                                if (success) success()
                            } else {
                                console.log(xhr.status)
                                if (fail) fail()
                            }
                        }

                        if (send) {
                            xhr.send(JSON.stringify(send))
                        } else xhr.send()
                    }

                    this.GET = (success, fail) => _request('GET', success, fail)
                    this.POST = (send, success, fail) => _request('POST', success, fail, send)
                    this.PATCH = (recordID, send, success, fail) => _request('PATCH', success, fail, send, recordID)
                    this.PUT = (recordID, send, success, fail) => _request('PUT', success, fail, send, recordID)
                    this.DELETE = (recordID, success, fail) => _request('DELETE', success, fail, null, recordID)
                }
            }

            /** Hold private functions. */
            const _private = {

                /** Format a string for URL compliance. */
                encodeForURL: string => encodeURIComponent(string),

                /** Create the Airtable REST endpoint for the given base and table. */
                getEndpoint: (baseID, tableName) => "https://api.airtable.com/v0/" + baseID + "/" + _private.encodeForURL(tableName),

                /** Retrieve non-empty fields for the last record with the most populated fields and store in `_props.records`. */
                getFields: _ => {
                    if (_props.records.length > 0) {
                        let record = _props.records[0]
                        _props.records.forEach(rec => {
                            if (Object.keys(rec.fields).length > Object.keys(record.fields).length) record = rec
                        })
                        _props.fields = Object.keys(record.fields)
                    }
                },

                /** Table initialization. The callback is the `onReady` parameter passed to the constructor. */
                init: callback => {
                    if (_props.options.name && _props.options.baseID && _props.options.apiKey) {
                        _props.endpoint = _private.getEndpoint(_props.options.baseID, _props.options.name)
                        const completeCallback = _ => {
                            _private.getFields()
                            callback()
                        }
                        _public.pull(completeCallback)
                    } else console.log('skip init - options required')
                },

                /** Generate the public API from the `_public` functions. */
                generateAPI: _ => Object.keys(_api).forEach(key => this[key] = _api[key]),

            }

            /** Hold public functions. */
            const _public = {

                /** 
                 * Loops until the `new Airtable.table()` initialization sequence is complete or fails if `loop.max` is reached first.
                 * @param {function=} callback - Function called after successful initialization.
                 */
                ready: callback => {
                    if (_state.ready) callback()
                    else {
                        const loop = {
                            interval: 100,
                            max: 200,
                            count: 0,
                        }

                        setTimeout(_ => {
                            loop.count++
                            if (loop.count < loop.max) _public.ready(callback)
                            else console.log('timeout: could not initialize table')
                        }, loop.interval)
                    }
                },

                /** 
                 * Returns an array of Airtable records that match the field:value pair.
                 * @param {string} field - The target field key with exact syntax/capitalization.
                 * @param {any} value - The value to match.
                 * @returns {array} An array of Airtable records that match the criteria.
                 */
                getRecordsByField: (field, value) => {
                    const found = []
                    Object.values(_props.records).forEach(record => {
                        if (record.fields[field]) {
                            if (record.fields[field] == value) {
                                found.push(record)
                            }
                        }
                    })
                    return found
                },

                /** 
                 * Returns an Airtable record whose `id` value matches the passed value. 
                 * @param {string} id - The `id` of the intended record. If it is unknown, see `getRecordsByField()`.
                 * @returns {object} An Airtable record object that matches the criteria.
                 */
                getRecordByID: id => {
                    let found = null
                    Object.values(_props.records).forEach(record => {
                        if (record.id == id) found = record
                    })
                    return found
                },

                /** 
                 * Pulls the current data from Airtable and updates the local store found in `table.records()`.
                 * @param {function=} callback - Function called following successful pull.
                 */
                pull: callback => {
                    if (_props.options.name && _props.options.baseID && _props.options.apiKey) {
                        const xhr = new XHR()
                        xhr.GET(_ => {
                            _props.records = xhr.response.records
                            if (callback) callback()
                        }, _ => console.log('pull error'))
                    } else console.log('pull error - options required')
                },

                /**
                 * Add a new record to the table. Must be a valid Airtable object. Automatically updates the local store upon success.
                 * @param {object} record - An object properly formatted for Airtable. Must have a `fields` property. See `new table.record()`.
                 * @param {function=} callback - Function called following successful add.
                 */
                add: (record, callback) => {
                    const xhr = new XHR()
                    xhr.POST(record, _ => {
                        _props.records[Object.keys(_props.records).length] = xhr.response // update the local store with the new record
                        if (callback) callback()
                    }, _ => console.log('add error'))
                },

                /** 
                 * Update an existing record. Automatically updates the local store upon success.
                 * @param {object} record - An object properly formatted for Airtable. Must have an `id` property. See `getRecordByField()` and `getRecordByID()`.
                 * @param {function=} callback - Function called following successful update.
                 */
                update: (record, callback) => {
                    // only try to update if a valid record exists
                    let found = false
                    _props.records.forEach(rec => {
                        if (rec.id == record.id) {
                            const formattedRecord = {
                                fields: record.fields,
                            }
                            const xhr = new XHR()
                            xhr.PATCH(record.id, formattedRecord, _ => {
                                _props.records.forEach(rec => { // update the local store with the changed record
                                    if (rec.id == record.id) rec.fields = record.fields
                                })
                                if (callback) callback
                            })
                        }
                    })
                    if (!found) console.log('no record found for that id')

                },

                /** Delete an existing record. Automatically updates the local store upon success.
                 * @param {object} record - An object properly formatted for Airtable. Must have an `id` property. See `getRecordByField()` and `getRecordByID()`.
                 * @param {function=} callback - Function called following successful delete.
                 */
                delete: (record, callback) => {
                    // only try to delete if a valid record exists
                    let found = false
                    _props.records.forEach(rec => {
                        if (rec.id == record.id) {
                            found = true
                            const xhr = new XHR()
                            xhr.DELETE(record.id, _ => {
                                _props.records.forEach((rec, index) => { // update the local store with by deleting the record
                                    if (rec.id == record.id) _props.records.splice(index, 1)
                                })
                                if (callback) callback()
                            })
                        }
                    })
                    if (!found) console.log('no record found for that id')
                },

                /** 
                 * Format an attachment object that can be passed to attachment fields. Airtable attachment fields require an array of attachment objects.
                 * @param {string} url - The URL (local or remote) of the attachment file. Airtable will download it and keep its own copy.
                 * @param {string=} filename - Optionally, you can rename the file before sending it to Airtable.
                 * @returns {object}
                 */
                attachment: (url, filename) => {
                    const attachment = {}
                    attachment.url = url
                    if (filename) attachment.filename = filename
                    return attachment
                },

            }

            /** Functions for the public API. */
            const _api = {
                pull: callback => _public.pull(callback),
                ready: callback => _public.ready(callback),

                getRecordsByField: (field, value) => _public.getRecordsByField(field, value),
                getRecordByID: id => _public.getRecordByID(id),

                add: (record, callback) => _public.add(record, callback),
                update: (record, callback) => _public.update(record, callback),
                delete: (record, callback) => _public.delete(record, callback),
                attachment: (url, filename) => _public.attachment(url, filename),

                records: _ => _props.records,
                fields: _ => _props.fields,
                endpoint: _ => _props.endpoint,
                options: _ => _props.options,
            }

            _private.generateAPI()
            _private.init(_ => {
                _state.ready = true
                if (onReady) onReady()
            })

        }
        // END CONSTRUCTOR
    },
    // END TABLE

    /* ******************** */
    // JSDoc for public API

    /**
     * @name Table#pull
     * @function @memberof Table
     * @description Pulls the current data from Airtable and updates the local store found in `table.records()`.
     * @param {function=} callback - Function called following successful pull.
     */

    /**
     * @name Table#ready
     * @function @memberof Table
     * @description Loops until the `new Airtable.table()` initialization sequence is complete or fails if `loop.max` is reached first.
     * @param {function=} callback - Function called after successful initialization.
     */

    /**
     * @name Table#getRecordsByField
     * @function @memberof Table
     * @description Returns an array of Airtable records that match the field:value pair.
     * @param {string} field - The target field key with exact syntax/capitalization.
     * @param {any} value - The value to match.
     * @returns {array} An array of Airtable records that match the criteria.
     */

    /**
     * @name Table#getRecordByID
     * @function @memberof Table
     * @description Returns an Airtable record whose `id` value matches the passed value. 
     * @param {string} id - The `id` of the intended record. If it is unknown, see `getRecordsByField()`.
     * @returns {object} An Airtable record object that matches the criteria.
     */


    /**
     * @name Table#add
     * @function @memberof Table
     * @description Add a new record to the table. Must be a valid Airtable object. Also updates the local store on success.
     * @param {object} record - An object properly formatted for Airtable. Must have a `fields` property. See `new table.record()`.
     * @param {function=} callback - Function called following successful add.
     */

    /**
     * @name Table#update
     * @function @memberof Table
     * @description Update an existing record. Also updates the local store on success.
     * @param {object} record - An object properly formatted for Airtable. Must have an `id` property. See `getRecordByField()` and `getRecordByID()`.
     * @param {function=} callback - Function called following successful update.
     */


    /**
     * @name Table#delete
     * @function @memberof Table
     * @description Delete an existing record. Also updates the local store on success.
     * @param {object} record - An object properly formatted for Airtable. Must have an `id` property. See `getRecordByField()` and `getRecordByID()`.
     * @param {function=} callback - Function called following successful delete.
     */

    /**
     * @name Table#attachment
     * @function @memberof Table
     * @description Format an attachment object that can be passed to attachment fields. Airtable attachment fields require an array of attachment objects.
     * @param {string} url - The URL (local or remote) of the attachment file. Airtable will download it and keep its own copy.
     * @param {string=} filename - Optionally, you can rename the file before sending it to Airtable.
     * @returns {object}
     */

    /**
     * @name Table#records
     * @function @memberof Table
     * @returns {array} Local record store.
     */

    /**
     * @name Table#fields
     * @function @memberof Table
     * @returns {array} Known field keys.
     */

    /**
     * @name Table#endpoint
     * @function @memberof Table
     * @returns {string} Airtable REST endpoint.
     */

    /**
     * @name Table#options
     * @function @memberof Table
     * @returns {AirpuckTableOptions} Options originally passed to the constructor.
     */

}