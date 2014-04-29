<?php
/**
 * contract controller for Sales application
 * 
 * @package     Sales
 * @subpackage  Controller
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2007-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * contract controller class for Sales application
 * 
 * @package     Sales
 * @subpackage  Controller
 */
class Sales_Controller_Contract extends Sales_Controller_NumberableAbstract
{
    /**
     * the number gets prefixed zeros until this amount of chars is reached
     *
     * @var integer
     */
    protected $_numberZerofill = 6;
    
    /**
     * the prefix for the invoice
     *
     * @var string
     */
    protected $_numberPrefix = 'V-';
    
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */
    private function __construct() {
        $this->_applicationName = 'Sales';
        $this->_backend = new Sales_Backend_Contract();
        $this->_modelName = 'Sales_Model_Contract';
    }    
    
    /**
     * holds the instance of the singleton
     *
     * @var Sales_Controller_Contract
     */
    private static $_instance = NULL;
    
    /**
     * the singleton pattern
     *
     * @return Sales_Controller_Contract
     */
    public static function getInstance() 
    {
        if (self::$_instance === NULL) {
            self::$_instance = new self();
        }
        
        return self::$_instance;
    }

    /****************************** overwritten functions ************************/

    /**
     * get by id
     *
     * @param string $_id
     * @return Tinebase_Record_RecordSet
     */
    public function get($_id)
    {
        $sharedContracts = $this->getSharedContractsContainer();
        return parent::get($_id, $sharedContracts->getId());
    }
    

    /**
     * @see Tinebase_Controller_Record_Abstract::update()
     */
    public function update(Tinebase_Record_Interface $_record, $_duplicateCheck = TRUE)
     {
        if ($_duplicateCheck) {
            $this->_checkNumberUniquity($_record, true);
        }
        $this->_checkNumberType($_record);
        return parent::update($_record, $_duplicateCheck);
    }
    
    /**
     * add one record
     *
     * @param   Tinebase_Record_Interface $_record
     * @return  Sales_Model_Contract
     */
    public function create(Tinebase_Record_Interface $_record)
    {
        // add container
        $_record->container_id = self::getSharedContractsContainer()->getId();

        if (Sales_Config::getInstance()->get(Sales_Config::CONTRACT_NUMBER_GENERATION, 'auto') == 'auto') {
            // add number if configured auto
            $this->_addNextNumber($_record);
        } else {
            // check uniquity if not autogenerated
            $this->_checkNumberUniquity($_record, false);
        }
        // check type
        $this->_checkNumberType($_record);
        
        return parent::create($_record);
    }

    /**
     * Checks if number is unique if manual generated
     *
     * @param Tinebase_Record_Interface $r
     * @throws Tinebase_Exception_Record_Validation
     */
    protected function _checkNumberType($record)
    {
        $number = $record->number;
    
        if (empty($number)) {
            throw new Tinebase_Exception_Record_Validation('Please use a contract number!');
        } elseif ((Sales_Config::getInstance()->get('contractNumberValidation', 'integer') == 'integer') && (! is_numeric($number))) {
            throw new Tinebase_Exception_Record_Validation('Please use a decimal number as contract number!');
        }
    }
    
    /**
     * get (create if it does not exist) container for shared contracts
     * 
     * @return Tinebase_Model_Container|NULL
     * 
     * @todo use Tinebase_Container::createSystemContainer()
     */
    public static function getSharedContractsContainer()
    {
        $sharedContracts = NULL;
        $appId = Tinebase_Application::getInstance()->getApplicationByName('Sales')->getId();
        
        try {
            $sharedContractsId = Sales_Config::getInstance()->get(Sales_Model_Config::SHAREDCONTRACTSID);
            $sharedContracts = Tinebase_Container::getInstance()->get($sharedContractsId);
        } catch (Tinebase_Exception_NotFound $tenf) {
            $newContainer = new Tinebase_Model_Container(array(
                'name'              => 'Shared Contracts',
                'type'              => Tinebase_Model_Container::TYPE_SHARED,
                'backend'           => 'Sql',
                'application_id'    => $appId,
                'model'             => 'Sales_Model_Contract'
            ));
            $sharedContracts = Tinebase_Container::getInstance()->addContainer($newContainer, NULL, TRUE);
            
            Sales_Config::getInstance()->set(Sales_Model_Config::SHAREDCONTRACTSID, $sharedContracts->getId());
            
            // add grants for groups
            $groupsBackend = Tinebase_Group::factory(Tinebase_Group::SQL);
            $adminGroup = $groupsBackend->getDefaultAdminGroup();
            $userGroup  = $groupsBackend->getDefaultGroup();
            Tinebase_Container::getInstance()->addGrants($sharedContracts, Tinebase_Acl_Rights::ACCOUNT_TYPE_GROUP, $userGroup, array(
                Tinebase_Model_Grants::GRANT_READ,
                Tinebase_Model_Grants::GRANT_EDIT
            ), TRUE);
            Tinebase_Container::getInstance()->addGrants($sharedContracts, Tinebase_Acl_Rights::ACCOUNT_TYPE_GROUP, $adminGroup, array(
                Tinebase_Model_Grants::GRANT_ADD,
                Tinebase_Model_Grants::GRANT_READ,
                Tinebase_Model_Grants::GRANT_EDIT,
                Tinebase_Model_Grants::GRANT_DELETE,
                Tinebase_Model_Grants::GRANT_ADMIN
            ), TRUE);
        }
        
        return $sharedContracts;
    }
    
    /**
     * sets the last billed date to the next date by interval and returns the updated contract
     * 
     * @param Sales_Model_Contract $contract
     * @return Sales_Model_Contract 
     */
    public function updateLastBilledDate(Sales_Model_Contract $contract)
    {
        
        // update last billed information -> set last_autobill to the date the invoice should have
        // been created and not to the current date, so we can calculate the interval properly
        $lastBilled = $contract->last_autobill ? clone $contract->last_autobill : NULL;
        
        if (Tinebase_Core::isLogLevel(Zend_Log::INFO)) {
            Tinebase_Core::getLogger()->info(__METHOD__ . '::' . __LINE__ . ' ' 
                . ' Updating last autobill to ' . $lastBilled);
        }
        
        if ($lastBilled === NULL) {
            // begin / end
            if ($contract->billing_point == 'begin') {
                // set billing date to start date
                $contract->last_autobill = clone $contract->start_date;
            } else {
                $contract->last_autobill = clone $contract->start_date;
                $contract->last_autobill->addMonth($contract->interval);
            }
        } else {
            $contract->last_autobill->addMonth($contract->interval);
        }
        
        return $this->update($contract);
    }
    
    /**
     * returns all billable contracts for the specified date. If a invoice has 
     * been created for the interval already, the contract will not be returned.
     * the products will also be checked.
     * 
     * relations and products will be returned
     * 
     * @param Tinebase_DateTime $date
     * @return Tinebase_Record_RecordSet
     */
    public function getBillableContracts(Tinebase_DateTime $date)
    {
        $dateBig = clone $date;
        $dateBig->addSecond(2);
        
        $dateSmall = clone $date;
        $dateSmall->subSecond(2);
        
        $ids = $this->_backend->getBillableContractIds($date);
        
        $filter = new Sales_Model_ContractFilter(array(
            array('field' => 'id', 'operator' => 'in', 'value' => $ids),
        ), 'AND');

        $contracts = $this->search($filter, NULL, /* get relations = */ TRUE);
        
        if ($contracts->count() == 0) {
            return $contracts;
        }
        
        $productAggregateController = Sales_Controller_ProductAggregate::getInstance();
        $filter = new Sales_Model_ProductAggregateFilter(array());
        $filter->addFilter(new Tinebase_Model_Filter_Text(array('field' => 'contract_id', 'operator' => 'in', 'value' => $contracts->getId())));
        $allProducts = $productAggregateController->search($filter);
         
        foreach($contracts as &$contract) {
            $products = $allProducts->filter('contract_id', $contract->getId());
            
            // if there aren't any products, and the interval of the contract is 0, don't handle contract
            if ($products->count() == 0 && $contract->interval == 0) {
                $contracts->removeRecord($contract);
                continue;
            }
            
            // contract has been terminated and last bill has been created already
            if ($contract->end_date && $contract->last_autobill > $contract->end_date) {
                $contracts->removeRecord($contract);
                continue;
            }
            
            $nextBill = $this->getNextBill($contract);
            
            if ($nextBill->isLater($dateBig)) {
                // don't handle, if contract don't have to be billed and there aren't any products
                if ($products->count() == 0) {
                    $contracts->removeRecord($contract);
                    continue;
                } else {
                    $billIt = FALSE;
                    // otherwise iterate products
                    foreach($products as $product) {
                        // is null, if this is the first time to bill the contract
                        $lastBilled = ($product->last_autobill === NULL) ? NULL : clone $product->last_autobill;
                        
                        // if the contract has been billed already, add the interval
                        if ($lastBilled) {
                            $nextBill = $lastBilled->addMonth($product->interval);
                        } else {
                            // it hasn't been billed already, so take the start_date of the contract as date
                            $nextBill = clone $contract->start_date;
                        }
                        
                        // assure creating the last bill bill if a contract has bee terminated
                        if (($contract->end_date !== NULL) && $nextBill->isLater($contract->end_date)) {
                            $nextBill = clone $contract->end_date;
                        }
                        
                        $nextBill->setTime(0,0,0);
                        // there is a product to bill, so stop to iterate
                        if ($nextBill->isLater($dateBig)) {
                            $billIt = TRUE;
                            break;
                        }
                        
                    }
                    
                    if (! $billIt) {
                        $contracts->removeRecord($contract);
                        continue;
                    }
                }
            }
            
            $contract->products = $products->count() ? $products->toArray() : NULL;
        }
        
        return $contracts;
    }
    /**
     * 
     * @param unknown $contract
     * @return unknown
     */
    public function getNextBill($contract)
    {
        // is null, if this is the first time to bill the contract
        $lastBilled = ($contract->last_autobill === NULL) ? NULL : clone $contract->last_autobill;
        
        // if the contract has been billed already, add the interval
        if ($lastBilled) {
            $nextBill = $lastBilled->addMonth($contract->interval);
        } else {
            // it hasn't been billed already, so take the start_date of the contract as date
            $nextBill = clone $contract->start_date;
        
            // add the interval to the date if the billing point is at the end of the period
            if ($contract->billing_point == 'end') {
                $nextBill->addMonth($contract->interval);
            }
        }
        
        // assure creating the last bill if a contract has been terminated
        if (($contract->end_date !== NULL) && $nextBill->isLater($contract->end_date)) {
            $nextBill = clone $contract->end_date;
        }
        
        $nextBill->setTime(0,0,0);
        
        return $nextBill;
    }
    /**
     * inspect creation of one record (after create)
     *
     * @param   Tinebase_Record_Interface $_createdRecord
     * @param   Tinebase_Record_Interface $_record
     * @return  void
     */
    protected function _inspectAfterCreate($_createdRecord, Tinebase_Record_Interface $_record)
    {
        $config = $_record::getConfiguration()->recordsFields;
        foreach (array_keys($config) as $property) {
            $this->_createDependentRecords($_createdRecord, $_record, $property, $config[$property]['config']);
        }
    }
    
    /**
     * inspect update of one record (before update)
     *
     * @param   Tinebase_Record_Interface $_record      the update record
     * @param   Tinebase_Record_Interface $_oldRecord   the current persistent record
     * @return  void
     */
    protected function _inspectBeforeUpdate($_record, $_oldRecord)
    {
        $config = $_record::getConfiguration()->recordsFields;
        foreach (array_keys($config) as $p) {
            $this->_updateDependentRecords($_record, $_oldRecord, $p, $config[$p]['config']);
        }
    }
}
