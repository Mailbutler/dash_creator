$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "dash_creator/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "dash_creator"
  s.version     = DashCreator::VERSION
  s.authors     = ["Elie Oriol"]
  s.email       = ["elie@mailbutler.io"]
  s.homepage    = "https://rubygems.org/gems/dash_creator"
  s.summary     = "DashCreator is a client-side dashboard creator gem."
  s.description = "DashCreator is a client-side dashboard creator gem. It can be used with any database to create filters, charts and dashboards of your own with a graphical interface."
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]

  s.add_dependency "rails", "~> 5.1"
  s.add_dependency "jquery-rails", "~> 4.3"
  s.add_dependency "redis-namespace", "~> 1.5"
end
