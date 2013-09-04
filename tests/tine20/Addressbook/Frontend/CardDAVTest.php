<?php
/**
 * Tine 2.0 - http://www.tine20.org
 * 
 * @package     Addressbook
 * @license     http://www.gnu.org/licenses/agpl.html
 * @copyright   Copyright (c) 2011-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 */

/**
 * Test helper
 */
require_once dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'TestHelper.php';

if (!defined('PHPUnit_MAIN_METHOD')) {
    define('PHPUnit_MAIN_METHOD', 'Addressbook_Frontend_CardDAVTest::main');
}

/**
 * Test class for Addressbook_Frontend_CardDAV
 */
class Addressbook_Frontend_CardDAVTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var array test objects
     */
    protected $objects = array();
    
    /**
     * Runs the test methods of this class.
     *
     * @access public
     * @static
     */
    public static function main()
    {
        $suite  = new PHPUnit_Framework_TestSuite('Tine 2.0 Addressbook CardDAV Tests');
        PHPUnit_TextUI_TestRunner::run($suite);
    }

    /**
     * Sets up the fixture.
     * This method is called before a test is executed.
     *
     * @access protected
     */
    protected function setUp()
    {
        Tinebase_TransactionManager::getInstance()->startTransaction(Tinebase_Core::getDb());
        
        $this->objects['initialContainer'] = Tinebase_Container::getInstance()->addContainer(new Tinebase_Model_Container(array(
            'name'              => Tinebase_Record_Abstract::generateUID(),
            'type'              => Tinebase_Model_Container::TYPE_PERSONAL,
            'backend'           => 'Sql',
            'application_id'    => Tinebase_Application::getInstance()->getApplicationByName('Addressbook')->getId(),
        )));
    }

    /**
     * Tears down the fixture
     * This method is called after a test is executed.
     *
     * @access protected
     */
    protected function tearDown()
    {
        Tinebase_TransactionManager::getInstance()->rollBack();
    }
    
    /**
     * test getChildren
     */
    public function testGetChildren()
    {
        $collection = new Addressbook_Frontend_CardDAV();
        
        $children = $collection->getChildren();
        
        $this->assertTrue($children[0] instanceof Addressbook_Frontend_WebDAV_Container);
    }
        
    /**
     * test getChild
     */
    public function testGetChild()
    {
        $collection = new Addressbook_Frontend_CardDAV();
        
        $child = $collection->getChild($this->objects['initialContainer']->getId());
        
        $this->assertTrue($child instanceof Addressbook_Frontend_WebDAV_Container);
    }
    
    /**
     * test to a create file. this should not be possible at this level
     */
    public function testCreateFile()
    {
        $collection = new Addressbook_Frontend_CardDAV();
        
        $this->setExpectedException('Sabre\DAV\Exception\Forbidden');
        
        $collection->createFile('foobar');
    }
    
    /**
     * test to create a new directory
     */
    public function testCreateDirectory()
    {
        $randomName = Tinebase_Record_Abstract::generateUID();
        
        $collection = new Addressbook_Frontend_CardDAV();
        
        $collection->createDirectory($randomName);
        
        $container = Tinebase_Container::getInstance()->getContainerByName('Addressbook', $randomName, Tinebase_Model_Container::TYPE_PERSONAL, Tinebase_Core::getUser());
        
        $this->assertTrue($container instanceof Tinebase_Model_Container);
    }
}
