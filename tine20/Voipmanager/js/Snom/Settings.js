/*
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Thomas Wadewitz <t.wadewitz@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id: Setting.js 3100 2008-06-26 11:55:07Z twadewitz $
 *
 */

Ext.namespace('Tine.Voipmanager.Snom.Settings');

Tine.Voipmanager.Snom.Settings.Main = {
       
    actions: {
        addSetting: null,
        editSetting: null,
        deleteSetting: null
    },
    
    handlers: {
        /**
         * onclick handler for addSetting
         */
        addSetting: function(_button, _event) 
        {
            Tine.Tinebase.Common.openWindow('settingsWindow', 'index.php?method=Voipmanager.editSnomSetting&settingId=', 770, 550);
        },

        /**
         * onclick handler for editSetting
         */
        editSetting: function(_button, _event) 
        {
            var selectedRows = Ext.getCmp('Voipmanager_Settings_Grid').getSelectionModel().getSelections();
            var settingId = selectedRows[0].id;
            
            Tine.Tinebase.Common.openWindow('settingsWindow', 'index.php?method=Voipmanager.editSnomSetting&settingId=' + settingId, 770, 550);
        },
        
        /**
         * onclick handler for deleteSetting
         */
        deleteSetting: function(_button, _event) {
            Ext.MessageBox.confirm('Confirm', 'Do you really want to delete the selected settings?', function(_button){
                if (_button == 'yes') {
                
                    var settingIds = [];
                    var selectedRows = Ext.getCmp('Voipmanager_Settings_Grid').getSelectionModel().getSelections();
                    for (var i = 0; i < selectedRows.length; ++i) {
                        settingIds.push(selectedRows[i].id);
                    }
                    
                    settingIds = Ext.util.JSON.encode(settingIds);
                    
                    Ext.Ajax.request({
                        url: 'index.php',
                        params: {
                            method: 'Voipmanager.deleteSnomSettings',
                            _settingIds: settingIds
                        },
                        text: 'Deleting setting(s)...',
                        success: function(_result, _request){
                            Ext.getCmp('Voipmanager_Settings_Grid').getStore().reload();
                        },
                        failure: function(result, request){
                            Ext.MessageBox.alert('Failed', 'Some error occured while trying to delete the setting.');
                        }
                    });
                }
            });
        }    
    },
    
    renderer: {
        contactTid: function(_data, _cell, _record, _rowIndex, _columnIndex, _store) {
            //switch(_data) {
            //    default:
                    return "<img src='images/oxygen/16x16/actions/user.png' width='12' height='12' alt='contact'/>";
            //}
        }       
    },

    initComponent: function()
    {
        this.translation = new Locale.Gettext();
        this.translation.textdomain('Voipmanager');
    
        this.actions.addSetting = new Ext.Action({
            text: this.translation._('add setting'),
            handler: this.handlers.addSetting,
            iconCls: 'action_add',
            scope: this
        });
        
        this.actions.editSetting = new Ext.Action({
            text: this.translation._('edit setting'),
            disabled: true,
            handler: this.handlers.editSetting,
            iconCls: 'action_edit',
            scope: this
        });
        
        this.actions.deleteSetting = new Ext.Action({
            text: this.translation._('delete setting'),
            disabled: true,
            handler: this.handlers.deleteSetting,
            iconCls: 'action_delete',
            scope: this
        });
    },

    updateMainToolbar : function() 
    {
        var menu = Ext.menu.MenuMgr.get('Tinebase_System_AdminMenu');
        menu.removeAll();
        /*menu.add(
            {text: 'product', handler: Tine.Crm.Main.handlers.editProductSource}
        );*/

        var adminButton = Ext.getCmp('tineMenu').items.get('Tinebase_System_AdminButton');
        adminButton.setIconClass('AddressbookTreePanel');
        //if(Tine.Voipmanager.rights.indexOf('admin') > -1) {
        //    adminButton.setDisabled(false);
        //} else {
            adminButton.setDisabled(true);
        //}

        var preferencesButton = Ext.getCmp('tineMenu').items.get('Tinebase_System_PreferencesButton');
        preferencesButton.setIconClass('VoipmanagerTreePanel');
        preferencesButton.setDisabled(true);
    },
    
    displaySettingsToolbar: function()
    {
        var onFilterChange = function(_field, _newValue, _oldValue){
            // only refresh data on new query strings
            if (_newValue != _oldValue) {
                Ext.getCmp('Voipmanager_Settings_Grid').getStore().load({
                    params: {
                        start: 0,
                        limit: 50
                    }
                });
            }
        };
        
        var quickSearchField = new Ext.ux.SearchField({
            id: 'quickSearchField',
            width: 240
        }); 
        quickSearchField.on('change', onFilterChange, this);
     
        var settingToolbar = new Ext.Toolbar({
            id: 'Voipmanager_Settings_Toolbar',
            split: false,
            height: 26,
            items: [
                this.actions.addSetting, 
                this.actions.editSetting,
                this.actions.deleteSetting,
                '->',
                this.translation._('Search: '), quickSearchField
            ]
        });

        Tine.Tinebase.MainScreen.setActiveToolbar(settingToolbar);
    },

    displaySettingsGrid: function() 
    {
        // the datastore
        var dataStore = new Ext.data.JsonStore({
            root: 'results',
            totalProperty: 'totalcount',
            id: 'id',
            fields: Tine.Voipmanager.Model.Snom.Setting,
            // turn on remote sorting
            remoteSort: true
        });
        
        dataStore.setDefaultSort('id', 'asc');

        dataStore.on('beforeload', function(_dataStore) {
            _dataStore.baseParams.query = Ext.getCmp('quickSearchField').getRawValue();
        }, this);   
        
        Ext.StoreMgr.add('SettingsStore', dataStore);
        
        // the paging toolbar
        var pagingToolbar = new Ext.PagingToolbar({
            pageSize: 50,
            store: dataStore,
            displayInfo: true,
            displayMsg: this.translation._('Displaying settings {0} - {1} of {2}'),
            emptyMsg: this.translation._("No settings to display")
        }); 
        
        // the columnmodel
        var columnModel = new Ext.grid.ColumnModel([
            { resizable: true, id: 'id', header: this.translation._('Id'), dataIndex: 'id', width: 30, hidden: true },
            { resizable: true, id: 'name', header: this.translation._('name'), dataIndex: 'name', width: 150 },
            { resizable: true, id: 'description', header: this.translation._('description'), dataIndex: 'description', width: 200 },
            { resizable: true, id: 'web_language', header: this.translation._('web_language'), dataIndex: 'web_language', width: 10, hidden: true },
            { resizable: true, id: 'language', header: this.translation._('language'), dataIndex: 'language', width: 10, hidden: true },
            { resizable: true, id: 'display_method', header: this.translation._('display_method'), dataIndex: 'display_method', width: 10, hidden: true },
            { resizable: true, id: 'tone_scheme', header: this.translation._('tone_scheme'), dataIndex: 'tone_scheme', width: 10, hidden: true },
            { resizable: true, id: 'mwi_notification', header: this.translation._('mwi_notification'), dataIndex: 'mwi_notification', width: 10, hidden: true },
            { resizable: true, id: 'mwi_dialtone', header: this.translation._('mwi_dialtone'), dataIndex: 'mwi_dialtone', width: 10, hidden: true },
            { resizable: true, id: 'headset_device', header: this.translation._('headset_device'), dataIndex: 'headset_device', width: 10, hidden: true },
            { resizable: true, id: 'date_us_format', header: this.translation._('date_us_format'), dataIndex: 'date_us_format', width: 10, hidden: true },
            { resizable: true, id: 'time_24_format', header: this.translation._('time_24_format'), dataIndex: 'time_24_format', width: 10, hidden: true },
            { resizable: true, id: 'with_flash', header: this.translation._('with_flash'), dataIndex: 'with_flash', width: 10, hidden: true },
            { resizable: true, id: 'message_led_other', header: this.translation._('message_led_other'), dataIndex: 'message_led_other', width: 10, hidden: true },
            { resizable: true, id: 'global_missed_counter', header: this.translation._('global_missed_counter'), dataIndex: 'global_missed_counter', width: 10, hidden: true },
            { resizable: true, id: 'scroll_outgoing', header: this.translation._('scroll_outgoing'), dataIndex: 'scroll_outgoing', width: 10, hidden: true },
            { resizable: true, id: 'show_local_line', header: this.translation._('show_local_line'), dataIndex: 'show_local_line', width: 10, hidden: true },
            { resizable: true, id: 'show_call_status', header: this.translation._('show_call_status'), dataIndex: 'show_call_status', width: 10, hidden: true },
            { resizable: true, id: 'redirect_event', header: this.translation._('redirect_event'), dataIndex: 'redirect_event', width: 10, hidden: true },
            { resizable: true, id: 'redirect_number', header: this.translation._('redirect_number'), dataIndex: 'redirect_number', width: 10, hidden: true },
            { resizable: true, id: 'redirect_always_on_code', header: this.translation._('redirect_always_on_code'), dataIndex: 'redirect_always_on_code', width: 10, hidden: true },
            { resizable: true, id: 'redirect_always_off_code', header: this.translation._('redirect_always_off_code'), dataIndex: 'redirect_always_off_code', width: 10, hidden: true },
            { resizable: true, id: 'redirect_busy_number', header: this.translation._('redirect_busy_number'), dataIndex: 'redirect_busy_number', width: 10, hidden: true },
            { resizable: true, id: 'redirect_busy_on_code', header: this.translation._('redirect_busy_on_code'), dataIndex: 'redirect_busy_on_code', width: 10, hidden: true },
            { resizable: true, id: 'redirect_busy_off_code', header: this.translation._('redirect_busy_off_code'), dataIndex: 'redirect_busy_off_code', width: 10, hidden: true },
            { resizable: true, id: 'redirect_time', header: this.translation._('redirect_time'), dataIndex: 'redirect_time', width: 10, hidden: true },
            { resizable: true, id: 'redirect_time_number', header: this.translation._('redirect_time_number'), dataIndex: 'redirect_time_number', width: 10, hidden: true },
            { resizable: true, id: 'redirect_time_on_code', header: this.translation._('redirect_time_on_code'), dataIndex: 'redirect_time_on_code', width: 10, hidden: true },
            { resizable: true, id: 'redirect_time_off_code', header: this.translation._('redirect_time_off_code'), dataIndex: 'redirect_time_off_code', width: 10, hidden: true },
            { resizable: true, id: 'dnd_on_code', header: this.translation._('dnd_on_code'), dataIndex: 'dnd_on_code', width: 10, hidden: true },
            { resizable: true, id: 'dnd_off_code', header: this.translation._('dnd_off_code'), dataIndex: 'dnd_off_code', width: 10, hidden: true },
            { resizable: true, id: 'ringer_headset_device', header: this.translation._('ringer_headset_device'), dataIndex: 'ringer_headset_device', width: 10, hidden: true },
            { resizable: true, id: 'ring_sound', header: this.translation._('ring_sound'), dataIndex: 'ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'alert_internal_ring_text', header: this.translation._('alert_internal_ring_text'), dataIndex: 'alert_internal_ring_text', width: 10, hidden: true },
            { resizable: true, id: 'alert_internal_ring_sound', header: this.translation._('alert_internal_ring_sound'), dataIndex: 'alert_internal_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'alert_external_ring_text', header: this.translation._('alert_external_ring_text'), dataIndex: 'alert_external_ring_text', width: 10, hidden: true },
            { resizable: true, id: 'alert_external_ring_sound', header: this.translation._('alert_external_ring_sound'), dataIndex: 'alert_external_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'alert_group_ring_text', header: this.translation._('alert_group_ring_text'), dataIndex: 'alert_group_ring_text', width: 10, hidden: true },
            { resizable: true, id: 'alert_group_ring_sound', header: this.translation._('alert_group_ring_sound'), dataIndex: 'alert_group_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'friends_ring_sound', header: this.translation._('friends_ring_sound'), dataIndex: 'friends_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'family_ring_sound', header: this.translation._('family_ring_sound'), dataIndex: 'family_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'colleagues_ring_sound', header: this.translation._('colleagues_ring_sound'), dataIndex: 'colleagues_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'vip_ring_sound', header: this.translation._('vip_ring_sound'), dataIndex: 'vip_ring_sound', width: 10, hidden: true },
            { resizable: true, id: 'custom_melody_url', header: this.translation._('custom_melody_url'), dataIndex: 'custom_melody_url', width: 10, hidden: true },
            { resizable: true, id: 'auto_connect_indication', header: this.translation._('auto_connect_indication'), dataIndex: 'auto_connect_indication', width: 10, hidden: true },
            { resizable: true, id: 'auto_connect_type', header: this.translation._('auto_connect_type'), dataIndex: 'auto_connect_type', width: 10, hidden: true },
            { resizable: true, id: 'privacy_out', header: this.translation._('privacy_out'), dataIndex: 'privacy_out', width: 10, hidden: true },
            { resizable: true, id: 'privacy_in', header: this.translation._('privacy_in'), dataIndex: 'privacy_in', width: 10, hidden: true },
            { resizable: true, id: 'presence_timeout', header: this.translation._('presence_timeout'), dataIndex: 'presence_timeout', width: 10, hidden: true },
            { resizable: true, id: 'enable_keyboard_lock', header: this.translation._('enable_keyboard_lock'), dataIndex: 'enable_keyboard_lock', width: 10, hidden: true },
            { resizable: true, id: 'keyboard_lock', header: this.translation._('keyboard_lock'), dataIndex: 'keyboard_lock', width: 10, hidden: true },
            { resizable: true, id: 'keyboard_lock_pw', header: this.translation._('keyboard_lock_pw'), dataIndex: 'keyboard_lock_pw', width: 10, hidden: true },
            { resizable: true, id: 'keyboard_lock_emergency', header: this.translation._('keyboard_lock_emergency'), dataIndex: 'keyboard_lock_emergency', width: 10, hidden: true },
            { resizable: true, id: 'emergency_proxy', header: this.translation._('emergency_proxy'), dataIndex: 'emergency_proxy', width: 10, hidden: true }
           
        ]);
        
        columnModel.defaultSortable = true; // by default columns are sortable
        
        // the rowselection model
        var rowSelectionModel = new Ext.grid.RowSelectionModel({multiSelect:true});

        rowSelectionModel.on('selectionchange', function(_selectionModel) {
            var rowCount = _selectionModel.getCount();

            if(rowCount < 1) {
                // no row selected
                this.actions.deleteSetting.setDisabled(true);
                this.actions.editSetting.setDisabled(true);
            } else if(rowCount > 1) {
                // more than one row selected
                this.actions.deleteSetting.setDisabled(false);
                this.actions.editSetting.setDisabled(true);
            } else {
                // only one row selected
                this.actions.deleteSetting.setDisabled(false);
                this.actions.editSetting.setDisabled(false);
            }
        }, this);
        
        // the gridpanel
        var gridPanel = new Ext.grid.GridPanel({
            id: 'Voipmanager_Settings_Grid',
            store: dataStore,
            cm: columnModel,
            tbar: pagingToolbar,     
            autoSizeColumns: false,
            selModel: rowSelectionModel,
            enableColLock:false,
            loadMask: true,
            autoExpandColumn: 'description',
            border: false,
            view: new Ext.grid.GridView({
                autoFill: true,
                forceFit:true,
                ignoreAdd: true,
                emptyText: 'No settings to display'
            })            
            
        });
        
        gridPanel.on('rowcontextmenu', function(_grid, _rowIndex, _eventObject) {
            _eventObject.stopEvent();
            if(!_grid.getSelectionModel().isSelected(_rowIndex)) {
                _grid.getSelectionModel().selectRow(_rowIndex);
            }
            var contextMenu = new Ext.menu.Menu({
                id:'ctxMenuSettings', 
                items: [
                    this.actions.editSetting,
                    this.actions.deleteSetting,
                    '-',
                    this.actions.addSetting 
                ]
            });
            contextMenu.showAt(_eventObject.getXY());
        }, this);
        
        gridPanel.on('rowdblclick', function(_gridPar, _rowIndexPar, ePar) {
            var record = _gridPar.getStore().getAt(_rowIndexPar);
            //console.log('id: ' + record.data.id);
            try {
                Tine.Tinebase.Common.openWindow('settingsWindow', 'index.php?method=Voipmanager.editSnomSetting&settingId=' + record.data.id, 770, 550);
            } catch(e) {
                // alert(e);
            }
        }, this);

        gridPanel.on('keydown', function(e){
             if(e.getKey() == e.DELETE && Ext.getCmp('Voipmanager_Settings_Grid').getSelectionModel().getCount() > 0){
                 this.handlers.deleteSetting();
             }
        }, this);

        // add the grid to the layout
        Tine.Tinebase.MainScreen.setActiveContentPanel(gridPanel);
    },
    
    /**
     * update datastore with node values and load datastore
     */
    loadData: function(_node)
    {
        var dataStore = Ext.getCmp('Voipmanager_Settings_Grid').getStore();

        dataStore.baseParams.method = 'Voipmanager.getSnomSettings';

        dataStore.load({
            params:{
                start:0, 
                limit:50 
            }
        });
    },

    show: function(_node) 
    {
        var currentToolbar = Tine.Tinebase.MainScreen.getActiveToolbar();

        if(currentToolbar === false || currentToolbar.id != 'Voipmanager_Settings_Toolbar') {
            this.initComponent();
            this.displaySettingsToolbar();
            this.displaySettingsGrid();
            this.updateMainToolbar();
        }
        this.loadData(_node);
    },
    
    reload: function() 
    {
        if(Ext.ComponentMgr.all.containsKey('Voipmanager_Settings_Grid')) {
            setTimeout ("Ext.getCmp('Voipmanager_Settings_Grid').getStore().reload()", 200);
        }
    }
};


Tine.Voipmanager.Snom.Settings.EditDialog =  {

        settingRecord: null,
        
        _templateData: null,
        
        updateSettingRecord: function(_settingData)
        {                     
            if(_settingData.last_modified_time && _settingData.last_modified_time !== null) {
                _settingData.last_modified_time = Date.parseDate(_settingData.last_modified_time, 'c');
            }
            if(_settingData.settings_loaded_at && _settingData.settings_loaded_at !== null) {
                _settingData.settings_loaded_at = Date.parseDate(_settingData.settings_loaded_at, 'c');
            }
            if(_settingData.firmware_checked_at && _settingData.firmware_checked_at !== null) {
                _settingData.firmware_checked_at = Date.parseDate(_settingData.firmware_checked_at, 'c');
            }
            this.settingRecord = new Tine.Voipmanager.Model.Snom.Setting(_settingData);
        },
        
        
        deleteSetting: function(_button, _event)
        {
            var settingIds = Ext.util.JSON.encode([this.settingRecord.get('id')]);
                
            Ext.Ajax.request({
                url: 'index.php',
                params: {
                    method: 'Voipmanager.deleteSnomSettings', 
                    settingIds: settingIds
                },
                text: 'Deleting setting...',
                success: function(_result, _request) {
                    window.opener.Tine.Voipmanager.Snom.Settings.Main.reload();
                    window.close();
                },
                failure: function ( result, request) { 
                    Ext.MessageBox.alert('Failed', 'Some error occured while trying to delete the setting.'); 
                } 
            });         
        },
        
        applyChanges: function(_button, _event, _closeWindow) 
        {
            var form = Ext.getCmp('voipmanager_editSettingForm').getForm();

            if(form.isValid()) {
                form.updateRecord(this.settingRecord);
                
               
                Ext.Ajax.request({
                    params: {
                        method: 'Voipmanager.saveSnomSetting', 
                        settingData: Ext.util.JSON.encode(this.settingRecord.data)
                    },
                    success: function(_result, _request) {
                        if(window.opener.Tine.Voipmanager.Snom.Settings) {
                            window.opener.Tine.Voipmanager.Snom.Settings.Main.reload();
                        }
                        if(_closeWindow === true) {
                            window.close();
                        } else {
                            this.updateSettingRecord(Ext.util.JSON.decode(_result.responseText).updatedData);
                            this.updateToolbarButtons();
                            form.loadRecord(this.settingRecord);
                        }
                    },
                    failure: function ( result, request) { 
                        Ext.MessageBox.alert('Failed', 'Could not save setting.'); 
                    },
                    scope: this 
                });
            } else {
                Ext.MessageBox.alert('Errors', 'Please fix the errors noted.');
            }
        },

        saveChanges: function(_button, _event) 
        {
            this.applyChanges(_button, _event, true);
        },
                
                  
        editSettingMainDialog: function(){
        
            var translation = new Locale.Gettext();
            translation.textdomain('Voipmanager');
        
            var _dialog = {
                title: translation._('SettingsMain'),
                layout: 'border',
                anchor: '100% 100%',
                layoutOnTabChange: true,
                defaults: {
                    border: true,
                    frame: true
                },
                items: [{
                    layout: 'hfit',
                    containsScrollbar: false,
                    //margins: '0 18 0 5',
                    autoScroll: true,
                    id: 'bla',
                    region: 'center',
                    items: [{
                        layout: 'column',
                        border: false,
                        anchor: '100%',
                        height: 70,
                        items: [{
                            columnWidth: .5,
                            layout: 'form',
                            border: false,
                            anchor: '100%',
                            items: [{
                                xtype: 'textfield',
                                fieldLabel: translation._('name'),
                                name: 'name',
                                maxLength: 150,
                                anchor: '98%',
                                allowBlank: false
                            }]
                        }, {
                            columnWidth: .5,
                            layout: 'form',
                            border: false,
                            anchor: '98%',
                            autoHeight: true,
                            items: [{
                                xtype: 'textarea',
                                name: 'description',
                                fieldLabel: translation._('Description'),
                                grow: false,
                                preventScrollbars: false,
                                anchor: '100%',
                                height: 45
                            }]
                        }]
                    }, {
                        layout: 'form',
                        border: false,
                        anchor: '100%',
                        items: [{
                            xtype: 'fieldset',
                            checkboxToggle: false,
                            id: 'general information',
                            title: translation._('general information'),
                            autoHeight: true,
                            anchor: '100%',
                            width: 800,
                            defaults: {
                                anchor: '100%'
                            },
                            items: [{
                                layout: 'column',
                                border: false,
                                anchor: '100%',
                                items: [{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('web_language'),
                                        name: 'web_language',
                                        id: 'web_language',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['English', translation._('English')],
                                                ['Deutsch', translation._('Deutsch')],
                                                ['Espanol', translation._('Espanol')],
                                                ['Francais', translation._('Francais')],
                                                ['Italiano', translation._('Italiano')],
                                                ['Nederlands', translation._('Nederlands')],
                                                ['Portugues', translation._('Portugues')],
                                                ['Suomi', translation._('Suomi')],
                                                ['Svenska', translation._('Svenska')],
                                                ['Dansk', translation._('Dansk')],
                                                ['Norsk', translation._('Norsk')]
                                            ]
                                        })
                                    }]
                                }, {
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('language'),
                                        name: 'language',
                                        id: 'language',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['English', translation._('English')],
                                                ['English(UK)', translation._('English(UK)')],
                                                ['Deutsch', translation._('Deutsch')],
                                                ['Espanol', translation._('Espanol')],
                                                ['Francais', translation._('Francais')],
                                                ['Italiano', translation._('Italiano')],
                                                ['Cestina', translation._('Cestina')],
                                                ['Nederlands', translation._('Nederlands')],
                                                ['Polski', translation._('Polski')],
                                                ['Portugues', translation._('Portugues')],
                                                ['Slovencina', translation._('Slovencina')],
                                                ['Suomi', translation._('Suomi')],
                                                ['Svenska', translation._('Svenska')],
                                                ['Dansk', translation._('Dansk')],
                                                ['Norsk',translation._('Norsk')],
                                                ['Japanese', translation._('Japanese')],
                                                ['Chinese', translation._('Chinese')]
                                            ]
                                        })
                                    }]
                                },{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('display_method'),
                                        name: 'display_method',
                                        id: 'display_method',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['full_contact', translation._('whole url')],
                                                ['display_name', translation._('name')],
                                                ['display_number', translation._('number')],
                                                ['display_name_number', translation._('name + number')],
                                                ['display_number_name', translation._('number + name')]
                                            ]
                                        })
                                    }]
                                }]
                            },{          
                                layout: 'column',
                                border: false,
                                anchor: '100%',
                                items: [{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('tone_scheme'),
                                        name: 'tone_scheme',
                                        id: 'tone_scheme',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['AUS', translation._('australia')],
                                                ['AUT', translation._('austria')],
                                                ['CHN', translation._('china')],
                                                ['DNK', translation._('dansk')],
                                                ['FRA', translation._('france')],
                                                ['GER', translation._('germany')],
                                                ['GBR', translation._('great britain')],
                                                ['IND', translation._('india')],
                                                ['ITA', translation._('italy')],
                                                ['JPN', translation._('japan')],
                                                ['MEX', translation._('mexiko')],
                                                ['NLD', translation._('netherlands')],
                                                ['NOR', translation._('norway')],
                                                ['NZL', translation._('newzealand')],
                                                ['ESP', translation._('spain')],
                                                ['SWE', translation._('sweden')],
                                                ['SWI', translation._('switzerland')],
                                                ['USA', translation._('usa')]
                                            ]
                                        })
                                    }]
                                }, {
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('mwi_notification'),
                                        name: 'mwi_notification',
                                        id: 'mwi_notification',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['silent', translation._('silent')],
                                                ['beep', translation._('beep')],
                                                ['reminder', translation._('reminder')]
                                            ]
                                        })
                                    }]
                                }, {
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('mwi_dialtone'),
                                        name: 'mwi_dialtone',
                                        id: 'mwi_dialtone',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['normal', translation._('normal')],
                                                ['stutter', translation._('stutter')]
                                            ]
                                        })
                                    }]
                                }]
                            },{          
                                layout: 'column',
                                border: false,
                                anchor: '100%',
                                items: [{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('headset_device'),
                                        name: 'headset_device',
                                        id: 'headset_device',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['none', translation._('none')],
                                                ['headset_rj', translation._('headset_rj')]
                                            ]
                                        })
                                    }]
                                }, {
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('date_us_format'),
                                        name: 'date_us_format',
                                        id: 'date_us_format',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                },{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('time_24_format'),
                                        name: 'time_24_format',
                                        id: 'time_24_format',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                }]
                            }, {          
                                layout: 'column',
                                border: false,
                                anchor: '100%',
                                items: [{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('with_flash'),
                                        name: 'with_flash',
                                        id: 'with_flash',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                }, {
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('message_led_other'),
                                        name: 'message_led_other',
                                        id: 'message_led_other',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                },{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('global_missed_counter'),
                                        name: 'global_missed_counter',
                                        id: 'global_missed_counter',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                }]
                            }, {          
                                layout: 'column',
                                border: false,
                                anchor: '100%',
                                items: [{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('scroll_outgoing'),
                                        name: 'scroll_outgoing',
                                        id: 'scroll_outgoing',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                },{
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('show_local_line'),
                                        name: 'show_local_line',
                                        id: 'show_local_line',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                }, {
                                    columnWidth: .33,
                                    layout: 'form',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        xtype: 'combo',
                                        fieldLabel: translation._('show_call_status'),
                                        name: 'show_call_status',
                                        id: 'show_call_status',
                                        mode: 'local',
                                        displayField: 'name',
                                        valueField: 'id',
                                        anchor: '98%',
                                        triggerAction: 'all',
                                        editable: false,
                                        forceSelection: true,
                                        store: new Ext.data.SimpleStore({
                                            id: 'id',
                                            fields: ['id', 'name'],
                                            data: [
                                                ['on', 'on'],
                                                ['off', 'off']
                                            ]
                                        })
                                    }]
                                }]
                            }]
                        }]
                    }, {
                        layout: 'form',
                        border: false,
                        anchor: '100%',
                        items: [{
                            xtype: 'fieldset',
                            checkboxToggle: false,
                            id: 'general information',
                            title: translation._('redirecting'),
                            autoHeight: true,
                            anchor: '100%',
                            defaults: {
                                anchor: '100%'
                            },
                            items: [{
                                xtype: 'combo',
                                fieldLabel: translation._('redirect_event'),
                                name: 'redirect_event',
                                id: 'redirect_event',
                                mode: 'local',
                                displayField: 'name',
                                valueField: 'id',
                                anchor: '98%',
                                triggerAction: 'all',
                                editable: false,
                                forceSelection: true,
                                store: new Ext.data.SimpleStore({
                                    id: 'id',
                                    fields: ['id', 'name'],
                                    data: [
                                        ['all', translation._('all')],
                                        ['busy', translation._('busy')],
                                        ['none', translation._('none')],
                                        ['time', translation._('time')]
                                    ]
                                })
                            },{
                                xtype: 'fieldset',
                                checkboxToggle: false,
                                id: 'general information',
                                title: translation._('all'),
                                layout: 'form',                                
                                autoHeight: true,
                                anchor: '100%',
                                width: 800,
                                defaults: {
                                    anchor: '100%'
                                },
                                items: [{
                                    layout: 'column',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        columnWidth: .33,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_number'),
                                            name: 'redirect_number',
                                            id: 'redirect_number',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }, {
                                        columnWidth: .33,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_always_on_code'),
                                            name: 'redirect_always_on_code',
                                            id: 'redirect_always_on_code',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    },{
                                        columnWidth: .33,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_always_off_code'),
                                            name: 'redirect_always_off_code',
                                            id: 'redirect_always_off_code',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }]
                                }]   // column
                            },{
                                xtype: 'fieldset',
                                checkboxToggle: false,
                                id: 'general information',
                                title: translation._('busy'),
                                layout: 'form',                                
                                autoHeight: true,
                                anchor: '100%',
                                width: 800,
                                defaults: {
                                    anchor: '100%'
                                },
                                items: [{
                                    layout: 'column',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        columnWidth: .33,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_busy_number'),
                                            name: 'redirect_busy_number',
                                            id: 'redirect_busy_number',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }, {
                                        columnWidth: .33,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_busy_on_code'),
                                            name: 'redirect_busy_on_code',
                                            id: 'redirect_busy_on_code',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    },{
                                        columnWidth: .33,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_busy_off_code'),
                                            name: 'redirect_busy_off_code',
                                            id: 'redirect_busy_off_code',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }]
                                }]   // column
                            },{
                                xtype: 'fieldset',
                                checkboxToggle: false,
                                id: 'general information',
                                title: translation._('time'),
                                layout: 'form',
                                autoHeight: true,
                                anchor: '100%',
                                width: 800,
                                defaults: {
                                    anchor: '100%'
                                },
                                items: [{
                                    layout: 'column',
                                    border: false,
                                    anchor: '100%',
                                    items: [{
                                        columnWidth: .1,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_time'),
                                            name: 'redirect_time',
                                            id: 'redirect_time',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }, {
                                        columnWidth: .3,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_time_number'),
                                            name: 'redirect_time_number',
                                            id: 'redirect_time_number',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }, {
                                        columnWidth: .3,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_time_on_code'),
                                            name: 'redirect_time_on_code',
                                            id: 'redirect_time_on_code',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    },{
                                        columnWidth: .3,
                                        layout: 'form',
                                        border: false,
                                        anchor: '100%',
                                        items: [{
                                            xtype: 'textfield',
                                            fieldLabel: translation._('redirect_time_off_code'),
                                            name: 'redirect_time_off_code',
                                            id: 'redirect_time_off_code',
                                            anchor: '98%',
                                            maxLength: 255
                                       }]
                                    }]
                                }]   // column
                            }]   // fieldset
                        }]   // fieldsest
                    }]   // form 
                }]   // center
            };
            
            return _dialog;   
        },
        
        updateToolbarButtons: function()
        {
            if(this.settingRecord.get('id') > 0) {
                Ext.getCmp('voipmanager_editSettingForm').action_delete.enable();
            }
        },
        
        display: function(_settingData, _snomLines, _lines, _templates, _locations) 
        {


            // Ext.FormPanel
            var dialog = new Tine.widgets.dialog.EditRecord({
                id : 'voipmanager_editSettingForm',
                //title: 'the title',
                labelWidth: 120,
                labelAlign: 'top',
                handlerScope: this,
                handlerApplyChanges: this.applyChanges,
                handlerSaveAndClose: this.saveChanges,
                handlerDelete: this.deleteSetting,
                items: [{
                    layout:'fit',
                    border: false,
                    autoHeight: true,
                    anchor: '100% 100%',
                    items: new Ext.TabPanel({
                        plain:true,
                        activeTab: 0,
                        id: 'editSettingTabPanel',
                        layoutOnTabChange:true,  
                        items:[
                            this.editSettingMainDialog()
                        ]
                    })
                   
                                        
                }]
            });

            
            var viewport = new Ext.Viewport({
                layout: 'border',
                frame: true,
                //height: 300,
                items: dialog
            });
               
            this.updateSettingRecord(_settingData);
            this.updateToolbarButtons();           
            dialog.getForm().loadRecord(this.settingRecord);
        } 
};


