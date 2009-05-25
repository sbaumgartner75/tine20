/**
 * Tine 2.0
 * 
 * @package     Felamimail
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id:MessageEditDialog.js 7170 2009-03-05 10:58:55Z p.schuele@metaways.de $
 *
 * TODO         make account combo work when loading from json
 * TODO         window title = subject?
 */
 
Ext.namespace('Tine.Felamimail');

Tine.Felamimail.MessageEditDialog = Ext.extend(Tine.widgets.dialog.EditDialog, {
    
    /**
     * @private
     */
    windowNamePrefix: 'MessageEditWindow_',
    appName: 'Felamimail',
    recordClass: Tine.Felamimail.Model.Message,
    recordProxy: Tine.Felamimail.messageBackend,
    loadRecord: false,
    tbarItems: [],
    evalGrants: false,
    //layout: 'form',
    
    /**
     * overwrite update toolbars function (we don't have record grants yet)
     */
    updateToolbars: function() {

    },
    
    /**
     * init record to edit
     * 
     * - overwritten to allow initialization from grid/onEditInNewWindow 
     */
    initRecord: function() {
        this.onRecordLoad();
    },
    
    /**
     * on render
     * 
     * @param {} ct
     * @param {} position
     * 
     * TODO use this to set initial window title?
     */
    onRender: function(ct, position){
        Tine.Felamimail.MessageEditDialog.superclass.onRender.call(this, ct, position);
        
        //this.window.setTitle(this.record.get('subject'));
    },
        
    /**
     * execuded when record gets updated from form
     * - add attachments to record here
     * 
     * TODO add recipients here as well?
     */
    onRecordUpdate: function() {

        this.record.data.attachments = [];
        this.attachmentGrid.store.each(function(record) {
            this.record.data.attachments.push(record.data);
        }, this);
        
        Tine.Felamimail.MessageEditDialog.superclass.onRecordUpdate.call(this);
    },
    
    /**
     * show error if request fails
     * 
     * @param {} response
     * @param {} request
     * 
     * TODO add exception dialog on critical errors?
     */
    onRequestFailed: function(response, request) {
        var responseText = Ext.util.JSON.decode(response.responseText);
        //console.log(responseText);
        Ext.MessageBox.alert(
            _('Failed'), 
            String.format(_('Could not send {0}.'), this.i18nRecordName) 
                + ' ( ' . _('Error:') + ' ' + responseText.msg + ')'
        ); 
        this.loadMask.hide();
    },
    
    /**
     * returns dialog
     * 
     * NOTE: when this method gets called, all initalisation is done.
     * 
     * TODO try to use autoheight
     * TODO get css definitions from extern stylesheet?
     */
    getFormItems: function() {
        
        this.recipientGrid = new Tine.Felamimail.RecipientGrid({
            //fieldLabel: _('Recipients'),
            record: this.record
        });
        
        this.attachmentGrid = new Tine.Felamimail.AttachmentGrid({
            //fieldLabel: _('Attachments'),
            record: this.record
        });
        
        this.htmlEditor = new Ext.form.HtmlEditor({
            fieldLabel: this.app.i18n._('Body'),
            name: 'body',
            allowBlank: true,
            height: 200,
            getDocMarkup: function(){
                var markup = '<html>'
                    + '<head>'
                    + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
                    + '<title></title>'
                    + '<style type="text/css">'
                        + '.felamimail-body-blockquote {'
                            + 'margin: 5px 10px 0 3px;'
                            + 'padding-left: 10px;'
                            + 'border-left: 2px solid #000088;'
                        + '} '
                        + '.felamimail-body-signature {'
                            + 'font-size: 9px;'
                            + 'color: #bbbbbb;'
                        + '} '
                    + '</style>'
                    + '</head>'
                    + '<body>'
                    + '</body></html>';
        
                return markup;
            }
        });
        
        return {
            //title: this.app.i18n._('Message'),
            autoScroll: true,
            border: false,
            frame: true,
            layout: 'border',
            items: [{
                region: 'center',
                xtype: 'columnform',
                labelAlign: 'top',
                formDefaults: {
                    xtype:'textfield',
                    anchor: '100%',
                    labelSeparator: '',
                    columnWidth: 1
                },
                items: [[{
                        xtype:'reccombo',
                        name: 'from',
                        fieldLabel: this.app.i18n._('From'),
                        displayField: 'user',
                        store: new Ext.data.Store({
                            fields: Tine.Felamimail.Model.Account,
                            proxy: Tine.Felamimail.accountBackend,
                            reader: Tine.Felamimail.accountBackend.getReader(),
                            remoteSort: true,
                            sortInfo: {field: 'user', dir: 'ASC'}
                        })
                    }, 
                    this.recipientGrid,
                    {
                        fieldLabel: this.app.i18n._('Subject'),
                        name: 'subject',
                        allowBlank: false
                    },
                    this.htmlEditor,
                    this.attachmentGrid
                ]] 
            }]
        };
    }
});

/**
 * Felamimail Edit Popup
 */
Tine.Felamimail.MessageEditDialog.openWindow = function (config) {
    var id = (config.record && config.record.id) ? config.record.id : 0;
    //config.title = _('Write New Mail');
    var window = Tine.WindowFactory.getWindow({
        width: 800,
        height: 550,
        name: Tine.Felamimail.MessageEditDialog.prototype.windowNamePrefix + id,
        contentPanelConstructor: 'Tine.Felamimail.MessageEditDialog',
        contentPanelConstructorConfig: config
    });
    return window;
};
