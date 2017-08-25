DashCreator.configure do |config|
  config.use_pgcrypto = true

  config.use_redis = true

  config.user_class = 'User'

  config.except_models = %w(DashCreator::Filter DashCreator::Chart DashCreator::Dashboard DashCreator::DashboardObject)

  config.except_attributes = %w(id password_digest)

  config.attributes_aliases = {

  }

  config.columns_aliases = {

  }

  config.displayed_model_names = {

  }

  config.displayed_attribute_names = {

  }
end