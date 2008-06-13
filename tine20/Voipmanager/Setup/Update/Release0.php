<?php
/**
 * Tine 2.0
 *
 * @package     Voipmanager
 * @license     http://www.gnu.org/licenses/agpl.html AGPL3
 * @copyright   Copyright (c) 2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 * @version     $Id$
 */

class Voipmanager_Setup_Update_Release0 extends Setup_Update_Abstract
{
    /**
     * add the lines table
     */    
    public function update_1()
    {
        $tableDefinition = "  
        <table>
            <name>asterisk_lines</name>
            <engine>InnoDB</engine>
            <charset>utf8</charset>
            <version>1</version>
            <declaration>
                <field>
                    <name>id</name>
                    <type>integer</type>
                    <length>11</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>name</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>accountcode</name>
                    <type>text</type>
                    <length>20</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>amaflags</name>
                    <type>text</type>
                    <length>13</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>callgroup</name>
                    <type>text</type>
                    <length>10</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>callerid</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>canreinvite</name>
                    <type>enum</type>
                    <value>yes</value>
                    <value>no</value>
                    <default>yes</default>
                </field>
                <field>
                    <name>context</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>defaultip</name>
                    <type>text</type>
                    <length>15</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>dtmfmode</name>
                    <type>enum</type>
                    <value>inband</value>
                    <value>info</value>
                    <value>rfc2833</value>
                    <default>rfc2833</default>
                </field>
                <field>
                    <name>fromuser</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>fromdomain</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>fullcontact</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>host</name>
                    <type>text</type>
                    <length>31</length>
                    <default>dynamic</default>
                </field>
                <field>
                    <name>insecure</name>
                    <type>enum</type>
                    <value>very</value>
                    <value>yes</value>
                    <value>no</value>
                    <value>invite</value>
                    <value>port</value>
                    <default>no</default>
                </field>
                <field>
                    <name>language</name>
                    <type>text</type>
                    <length>2</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>mailbox</name>
                    <type>text</type>
                    <length>50</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>md5secret</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>nat</name>
                    <type>enum</type>
                    <value>yes</value>
                    <value>no</value>
                    <default>no</default>
                </field>
                <field>
                    <name>deny</name>
                    <type>text</type>
                    <length>95</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>permit</name>
                    <type>text</type>
                    <length>95</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>mask</name>
                    <type>text</type>
                    <length>95</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>pickupgroup</name>
                    <type>text</type>
                    <length>10</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>port</name>
                    <type>text</type>
                    <length>5</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>qualify</name>
                    <type>enum</type>
                    <value>yes</value>
                    <value>no</value>
                    <default>no</default>
                </field>
                <field>
                    <name>restrictcid</name>
                    <type>text</type>
                    <length>1</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>rtptimeout</name>
                    <type>text</type>
                    <length>3</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>rtpholdtimeout</name>
                    <type>text</type>
                    <length>3</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>secret</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>type</name>
                    <type>enum</type>
                    <value>friend</value>
                    <value>user</value>
                    <value>peer</value>
                    <default>friend</default>
                </field>
                <field>
                    <name>username</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>disallow</name>
                    <type>text</type>
                    <length>100</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>allow</name>
                    <type>text</type>
                    <length>100</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>musiconhold</name>
                    <type>text</type>
                    <length>100</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>regseconds</name>
                    <type>integer</type>
                    <length>11</length>
                    <default>0</default>
                </field>
                <field>
                    <name>ipaddr</name>
                    <type>text</type>
                    <length>15</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>regexten</name>
                    <type>text</type>
                    <length>80</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>cancallforward</name>
                    <type>enum</type>
                    <value>yes</value>
                    <value>no</value>
                    <default>yes</default>
                </field>
                <field>
                    <name>setvar</name>
                    <type>text</type>
                    <length>100</length>
                    <notnull>true</notnull>
                </field>
                <field>
                    <name>notifyringing</name>
                    <type>enum</type>
                    <value>yes</value>
                    <value>no</value>
                    <default>yes</default>
                </field>
                <field>
                    <name>useclientcode</name>
                    <type>enum</type>
                    <value>yes</value>
                    <value>no</value>
                    <default>yes</default>
                </field>
                <field>
                    <name>authuser</name>
                    <type>text</type>
                    <length>100</length>
                    <notnull>false</notnull>
                </field>
                <field>
                    <name>call-limit</name>
                    <type>integer</type>
                    <length>11</length>
                    <default>5</default>
                </field>
                <field>
                    <name>busy-level</name>
                    <type>integer</type>
                    <length>11</length>
                    <default>1</default>
                </field>
                <index>
                    <name>id</name>
                    <primary>true</primary>
                    <field>
                        <name>id</name>
                    </field>
                </index>
            </declaration>
        </table>";

        $table = Setup_Backend_Schema_Table_Factory::factory('String', $tableDefinition); 
        $this->_backend->createTable($table);        

        $this->setApplicationVersion('Voipmanager', '0.2');
    }    
}