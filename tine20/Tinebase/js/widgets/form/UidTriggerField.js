/* 
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Michael Spahn <m.spahn@metaways.de>
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */

/*global Ext, Tine*/

Ext.ns('Tine.Tinebase.widgets.form');

/**
 * This is a TriggerField which generates a random UID on click
 * (UID generated by Tine.Tinebase.data.Record.generateUID())
 * 
 * @namespace   Tine.Tinebase.widgets.form
 * @author      Michael Spahn <m.spahn@metaways.de>
 * @class       Tine.Tinebase.widgets.form.UidTriggerField
 * @extends     Ext.form.TriggerField
 */
Tine.Tinebase.widgets.form.UidTriggerField = Ext.extend(Ext.form.TriggerField, {

    itemCls: 'tw-uidTriggerField',
    enableKeyEvents: true,

    /**
     * Overrides initComponent to reenable field if it is empty
     */
    initComponent: function () {
        this.on('keyup', this.manageTriggerField);

        Tine.Tinebase.widgets.form.UidTriggerField.superclass.initComponent.call(this);
    },

    /**
     * Shows trigger field if value is empty and hides if it is filled
     */
    manageTriggerField: function () {
        this.setHideTrigger(this.getValue());
    },

    /**
     * Overrides setValue and shows trigger field if value is empty and hides if it is filled
     * 
     * @param Mixed
     * @return {Ext.form.Field} this
     */
    setValue: function (value) {
        var ret = Tine.Tinebase.widgets.form.UidTriggerField.superclass.setValue.call(this, value);

        this.manageTriggerField();
        return ret;
    },

    /**
     * Fills field on click with a random, unique checksum and hides trigger button
     */
    onTriggerClick: function () {
        if (!this.getValue()) {
            this.setValue(Tine.Tinebase.data.Record.generateUID());
            this.setHideTrigger(true);
        }
    }
});

Ext.reg('tw-uidtriggerfield',Tine.Tinebase.widgets.form.UidTriggerField);
