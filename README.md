# DashCreator
DashCreator is a client-side dashboard creator gem.
It can be used with any database to create filters, charts and dashboards of your own with a graphical interface.

## Installation
Add this line to your application's Gemfile:

```ruby
gem 'dash_creator'
```

And then execute:
```bash
$ bundle
```

Or install it yourself as:
```bash
$ gem install dash_creator
```

Then run the generator:
```bash
$ rails g dash_creator:install
```
It will add to your project:
  - DashCreator routes in config/routes.db
  - DashCreator migrations in db/migrate
  - acts_as_dash_creator to app/models/user.rb if this file is found
  - user_for_dash_creator helper function in app/controllers/application_controller.rb
  - dash_creator.rb initializer in config/initializers
  
In the added initializer, by default Redis is used.
If you don't use Redis, then go in the initializer and change:
```ruby
$redis = Redis::Namespace.new("app_chart_cache", :redis => Redis.new)
config.redis_store_variable = $redis
```

To:
```ruby
config.redis_store_variable = nil
```

Then you can migrate:
```bash
$ rails db:migrate
```

## Usage

In config/initializers you will find a dash_creator.rb file after having run the generator.
In this initializer you can define several options used by the gem:
  - user_class: the name of the app's user model that will own the dashboards
  - except_models: array of the names of the models you do not want to use in DashCreator
  - except_attributes: array of the names (such as they are in database) of the attributes you do not want to use in DashCreator
  - attributes_aliases: the name aliases of the attributes from DB to model name
  - columns_aliases: the column name aliases of the attributes from Rails to DB
  - displayed_model_names: change displayed names for models
  - displayed_model_attributes: change displayed names for attributes for each model
  
For example, we have in Contact model:
```ruby
belongs_to :owner, class_name: 'User', foreign_key: 'owned_by'
```

Then we should provide in the initializer:
```ruby
config.attributes_aliases = {
    owned_by: 'user_id'
}
config.columns_aliases = {
    owner_id: 'owned_by'
}
```
- columns_aliases translate names from the ones used in Rails ('owner' => 'owner_id') to the ones used in database ('owned_by' foreign_key)
- attributes_aliases translate names from the ones used in database ('owned_by' foreign_key) to the associated model ones ('User' model => 'user_id')

One must also add the following functions:
  - In main application controller, user_for_dash_creator: provide right user to DashCreator (default: current_user)
  - In user model, acts_as_dash_creator: add ownership of filters, charts and dashboards to the right model (default: user.rb)
  - In model, acts_as_dashboard_object: add object to list of dashboard_objects that can be displayed in a dashboard

If you use pgcrypto extension (PostgreSQL) in your DB to encrypt the ids, it will be used by default for DashCreator tables, except if you set it to false in initializer.

For the moment the following types are handled:
- numeric: integer, float, decimal
- string, text
- boolean
- datetime, date

You can define your own layout for DashCreator in initializer.
If your layout includes links, you may have to change them from 'blabla_path' to 'main_app.blabla_path'.
Don't forget to also include the following lines in the head of your layout for DashCreator to work properly:
```html
<%= stylesheet_link_tag 'dash_creator/application', media: 'all', 'data-turbolinks-track': 'reload' %>
<%= javascript_include_tag 'dash_creator/application', 'data-turbolinks-track': 'reload' %>
```

## Known bugs
Don't plot charts using filters with a defined number of records.
Result will be wrong and not limited to the wanted number.

## TODO List
It would be good to find an alternative to redis to store chart_data

Add a share chart function (send chart id with a temporary hash stored in redis), export chart as image

Customize everything on your chart:
- points style & size for each dataset
- line (style, stepped) for each dataset
- tooltips (particularly add info)
- data labeling on chart (values next to points)
- bar (horizontal, several colors for non date)

Probably some stuff to do with acts_as_dashboard_object: self defined partials.
Explain the DashboardObject usage, what about customized partials ? Change chart's one ?

different filters for same model at once

Time type ? To link with numeric maybe ?

## License
The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).