DashCreator.configure do |config|
  # # Check dash_creator README for further information

  # Use pgcrypto extension or not for DashCreator model ids
  config.use_pgcrypto = true

  # Use redis to store charts data (to avoid heavy refreshing each time)
  # Set it to nil if you do not use redis or if you do not want charts data to be stored
  $redis = Redis::Namespace.new("app_chart_cache", :redis => Redis.new)
  config.redis_store_variable = $redis

  # The name of the class the filters, charts and dashboards belong to
  config.user_class = 'User'

  # Array of the names of the models you do not want to use in DashCreator
  config.except_models = %w(DashCreator::Filter DashCreator::Chart DashCreator::Dashboard DashCreator::DashboardObject)

  # Array of the names (such as they are in database) of the attributes you do not want to use in DashCreator
  # TODO: make it per model ?
  config.except_attributes = %w(id password_digest)

  # The name aliases of the attributes from DB to model name
  # Ex    owned_by: 'user_id'
  config.attributes_aliases = {

  }

  # The column name aliases of the attributes from Rails to DB
  # Ex    owner_id: 'owned_by'
  config.columns_aliases = {

  }

  # Change displayed names for models
  # Ex    Egg: 'Milk'
  config.displayed_model_names = {

  }

  # Change displayed names for attributes for each model
  # Ex    User: { bday: 'Date of birth', child_id: 'Kid' }
  config.displayed_attribute_names = {

  }
end