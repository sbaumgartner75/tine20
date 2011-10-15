<?php
/**
 * class to handle a single vcard
 *
 * @package     Addressbook
 * @subpackage  Frontend
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 * @copyright   Copyright (c) 2011-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * class to handle a single vcard
 *
 * This class handles the creation, update and deletion of vcards
 *
 * @package     Addressbook
 * @subpackage  Frontend
 */
class Addressbook_Frontend_WebDAV_Contact extends Sabre_DAV_File implements Sabre_CardDAV_ICard, Sabre_DAVACL_IACL
{
    /**
     * @var Addressbook_Model_Contact
     */
    protected $_contact;
    
    /**
     * holds the vcard returned to the client
     * 
     * @var string
     */
    protected $_vcard;
    
    /**
     * @var Addressbook_Convert_Contact_VCard_Interface
     */
    protected $_converter;
    
    /**
     * Constructor 
     * 
     * @param  string|Addressbook_Model_Contact  $_contact  the id of a contact or the contact itself 
     */
    public function __construct($_contact = null) 
    {
        $this->_contact = $_contact;

        // AddressBook/6.0 (1043) CardDAVPlugin/182 CFNetwork/520.0.13 Mac_OS_X/10.7.1 (11B26)
        if (preg_match('/^AddressBook.*Mac_OS_X\/(?P<version>.*) /', $_SERVER['HTTP_USER_AGENT'], $matches)) {
            $backend = Addressbook_Convert_Contact_VCard_Factory::CLIENT_MACOSX;
            $version = $matches['version'];
            
        // Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.2.21) Gecko/20110831 Lightning/1.0b2 Thunderbird/3.1.13
        } elseif (preg_match('/ Thunderbird\/(?P<version>.*)/', $_SERVER['HTTP_USER_AGENT'], $matches)) {
            $backend = Addressbook_Convert_Contact_VCard_Factory::CLIENT_SOGO;
            $version = $matches['version'];
            
        // generic client
        } else {
            $backend = Addressbook_Convert_Contact_VCard_Factory::CLIENT_GENERIC;
            $version = null;
        }
        
        $this->_converter = Addressbook_Convert_Contact_VCard_Factory::factory($backend, $version);
    }
    
    /**
     * this function creates a Addressbook_Model_Contact and stores it in the database
     * 
     * @todo the header handling does not belong here. It should be moved to the DAV_Server class when supported
     * 
     * @param  Tinebase_Model_Container  $container
     * @param  stream|string           $vcardData
     */
    public static function create(Tinebase_Model_Container $container, $vcardData)
    {
        // AddressBook/6.0 (1043) CardDAVPlugin/182 CFNetwork/520.0.13 Mac_OS_X/10.7.1 (11B26)
        if (preg_match('/^AddressBook.*Mac_OS_X\/(?P<version>.*) /', $_SERVER['HTTP_USER_AGENT'], $matches)) {
            $backend = Addressbook_Convert_Contact_VCard_Factory::CLIENT_MACOSX;
            $version = $matches['version'];
        
        // Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.2.21) Gecko/20110831 Lightning/1.0b2 Thunderbird/3.1.13
        } elseif (preg_match('/ Thunderbird\/(?P<version>.*)/', $_SERVER['HTTP_USER_AGENT'], $matches)) {
            $backend = Addressbook_Convert_Contact_VCard_Factory::CLIENT_SOGO;
            $version = $matches['version'];
            
        // generic client
        } else {
            $backend = Addressbook_Convert_Contact_VCard_Factory::CLIENT_GENERIC;
            $version = null;
        }
        
        $converter = Addressbook_Convert_Contact_VCard_Factory::factory($backend, $version);
        
        $contact = $converter->toTine20Model($vcardData);
        $contact->container_id = $container->getId();
        
        $contact = Addressbook_Controller_Contact::getInstance()->create($contact);
        
        $card = new self($contact);
                
        return $card;
    }
    
    /**
     * Deletes the card
     *
     * @return void
     */
    public function delete() 
    {
        Addressbook_Controller_Contact::getInstance()->delete($this->_contact);
    }
    
    /**
     * Returns the VCard-formatted object 
     * 
     * @return stream
     */
    public function get() 
    {
        $s = fopen('php://temp','r+');
        fwrite($s, $this->_getVCard());
        rewind($s);
        
        return $s;
    }
    
    /**
     * Returns the uri for this object 
     * 
     * @return string 
     */
    public function getName() 
    {
        return $this->getRecord()->getId() . '.vcf';
    }
    
    /**
     * Returns the owner principal
     *
     * This must be a url to a principal, or null if there's no owner 
     * 
     * @todo add real owner
     * @return string|null
     */
    public function getOwner() 
    {
        return null;
        return $this->addressBookInfo['principaluri'];
    }

    /**
     * Returns a group principal
     *
     * This must be a url to a principal, or null if there's no owner
     * 
     * @todo add real group
     * @return string|null 
     */
    public function getGroup() 
    {
        return null;
    }
    
    /**
     * Returns a list of ACE's for this node.
     *
     * Each ACE has the following properties:
     *   * 'privilege', a string such as {DAV:}read or {DAV:}write. These are 
     *     currently the only supported privileges
     *   * 'principal', a url to the principal who owns the node
     *   * 'protected' (optional), indicating that this ACE is not allowed to 
     *      be updated. 
     * 
     * @todo add the real logic
     * @return array 
     */
    public function getACL() 
    {
        return null;
        
        return array(
            array(
                'privilege' => '{DAV:}read',
                'principal' => $this->addressBookInfo['principaluri'],
                'protected' => true,
            ),
            array(
                'privilege' => '{DAV:}write',
                'principal' => $this->addressBookInfo['principaluri'],
                'protected' => true,
            ),
        );

    }
    
    /**
     * Returns the mime content-type
     *
     * @return string
     */
    public function getContentType() {
    
        return 'text/x-vcard';
    
    }
    
    /**
     * Returns an ETag for this object
     *
     * @return string
     */
    public function getETag() 
    {
        return '"' . md5($this->getRecord()->getId() . $this->getLastModified()) . '"';
    }
    
    /**
     * Returns the last modification date as a unix timestamp
     *
     * @return time
     */
    public function getLastModified() 
    {
        return ($this->getRecord()->last_modified_time instanceof Tinebase_DateTime) ? $this->getRecord()->last_modified_time->toString() : $this->getRecord()->creation_time->toString();
    }
    
    /**
     * Returns the size of the vcard in bytes
     *
     * @return int
     */
    public function getSize() 
    {
        return strlen($this->_getVCard());
    }
    
    /**
     * Updates the VCard-formatted object
     *
     * @param string $cardData
     * @return void
     */
    public function put($cardData) 
    {
        if (get_class($this->_converter) == 'Addressbook_Convert_Contact_VCard_Generic') {
            throw new Sabre_DAV_Exception_Forbidden('Update denied for unknow client');
        }
        
        $contact = $this->_converter->toTine20Model($cardData, $this->getRecord());
        
        $this->_contact = Addressbook_Controller_Contact::getInstance()->update($contact);
        $this->_vcard   = null;

        // avoid sending headers during unit tests
        if (php_sapi_name() != 'cli') {
            // @todo this belongs to DAV_Server, but is currently not supported
            header('ETag: ' . $this->getETag());
        }
    }
    
    /**
     * Updates the ACL
     *
     * This method will receive a list of new ACE's. 
     * 
     * @param array $acl 
     * @return void
     */
    public function setACL(array $acl) 
    {
        throw new Sabre_DAV_Exception_MethodNotAllowed('Changing ACL is not yet supported');
    }
    
    /**
     * return Addressbook_Model_Contact and convert contact id to model if needed
     * 
     * @return Addressbook_Model_Contact
     */
    public function getRecord()
    {
        if (! $this->_contact instanceof Addressbook_Model_Contact) {
            $this->_contact = str_replace('.vcf', '', $this->_contact);
            $this->_contact = Addressbook_Controller_Contact::getInstance()->get($this->_contact);
        }
        
        return $this->_contact;
    }
    
    /**
     * return vcard and convert Addressbook_Model_Contact to vcard if needed
     * 
     * @return string
     */
    protected function _getVCard()
    {
        if ($this->_vcard == null) {
            $this->_vcard = $this->_converter->fromTine20Model($this->getRecord());
        }
        
        return $this->_vcard;
    }
}
