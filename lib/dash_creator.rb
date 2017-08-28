require "dash_creator/engine"
require "dash_creator/acts_as_dash_creator"
require "dash_creator/acts_as_dashboard_object"

module DashCreator

  class Configuration
    mattr_accessor :use_pgcrypto
    mattr_accessor :redis_store_variable

    mattr_accessor :user_class
    mattr_accessor :except_models
    mattr_accessor :except_attributes
    mattr_accessor :attributes_aliases
    mattr_accessor :columns_aliases
    mattr_accessor :displayed_model_names
    mattr_accessor :displayed_attribute_names

    mattr_accessor :layout_path

    self.use_pgcrypto = true
    self.redis_store_variable = nil

    self.user_class = 'User'
    self.except_models = []
    self.except_attributes = []
    self.attributes_aliases = {}
    self.columns_aliases = {}
    self.displayed_model_names = {}
    self.displayed_attribute_names = {}

    self.layout_path = 'dash_creator/layouts/application'
  end
  class << self
    attr_writer :configuration
  end

  module_function
  def configuration
    @configuration ||= Configuration.new
  end

  def configure
    yield(configuration)
  end


  def self.use_pgcrypto
    self.configuration.use_pgcrypto
  end

  def self.redis_store_variable
    self.configuration.redis_store_variable
  end

  def self.user_class
    self.configuration.user_class.safe_constantize
  end

  def self.except_models
    self.configuration.except_models.map{ |m| m.gsub('::', '') }
  end

  def self.except_attributes
    self.configuration.except_attributes
  end

  def self.attributes_aliases
    self.configuration.attributes_aliases.stringify_keys
  end

  def self.columns_aliases
    self.configuration.columns_aliases.stringify_keys
  end

  def self.displayed_model_names
    self.configuration.displayed_model_names.stringify_keys
  end

  def self.displayed_attribute_names
    self.configuration.displayed_attribute_names.deep_stringify_keys
  end

  def self.layout_path
    self.configuration.layout_path
  end
end