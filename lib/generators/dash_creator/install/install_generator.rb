require 'rails/generators'
require 'rails/generators/migration'

module DashCreator
  module Generators
    class InstallGenerator < ::Rails::Generators::Base
      include Rails::Generators::Migration
      source_root File.expand_path('../templates', __FILE__)
      desc 'add the migrations'

      def self.next_migration_number(path)
        unless @prev_migration_nr
          @prev_migration_nr = Time.now.utc.strftime("%Y%m%d%H%M%S").to_i
        else
          @prev_migration_nr += 1
        end
        @prev_migration_nr.to_s
      end

      def copy_migrations
        migration_template 'create_dash_creator_filters.rb', 'db/migrate/create_dash_creator_filters.rb'
        migration_template 'create_dash_creator_charts.rb', 'db/migrate/create_dash_creator_charts.rb'
        migration_template 'create_dash_creator_dashboards.rb', 'db/migrate/create_dash_creator_dashboards.rb'
        migration_template 'create_dash_creator_dashboard_objects.rb', 'db/migrate/create_dash_creator_dashboard_objects.rb'
        migration_template 'add_indexes_to_dash_creator_tables.rb', 'db/migrate/add_indexes_to_dash_creator_tables.rb'
      end

      def copy_initializer_file
        template 'initializer.rb', 'config/initializers/dash_creator.rb'
      end

      def add_default_user_for_dash_creator
        line = 'class ApplicationController < ActionController::Base'
        gsub_file 'app/controllers/application_controller.rb', /(#{Regexp.escape(line)})/mi do |match|
          "#{match}\n  def user_for_dash_creator\n    current_user\n  end\n"
        end
      end

      def add_default_acts_as_dash_creator
        line = 'class User < ApplicationRecord'
        gsub_file 'app/models/user.rb', /(#{Regexp.escape(line)})/mi do |match|
          "include DashCreator::ActsAsDashCreator\n\n#{match}\n  acts_as_dash_creator\n"
        end

        line = 'class User < ActiveRecord::Base'
        gsub_file 'app/models/user.rb', /(#{Regexp.escape(line)})/mi do |match|
          "include DashCreator::ActsAsDashCreator\n\n#{match}\n  acts_as_dash_creator\n"
        end
      end

      def add_dash_creator_routes
        line = 'Rails.application.routes.draw do'
        gsub_file 'config/routes.rb', /(#{Regexp.escape(line)})/mi do |match|
          "#{match}\n  mount DashCreator::Engine, at: '/dash_creator'\n"
        end
      end

      def add_template_dashboard_views
        path = File.dirname(__FILE__) + '/templates/'
        user_views_path = 'app/views/user/'
        dashboard_objects_path = 'app/views/dash_creator/dashboard_object/'
        create_file user_views_path + 'dashboard.html.erb', File.read(path + 'dashboard.html.erb')
        create_file user_views_path + '_section_card.html.erb', File.read(path + '_section_card.html.erb')
        create_file dashboard_objects_path + '_chart.html.erb', File.read(path + '_chart.html.erb')
        create_file dashboard_objects_path + '_stat.html.erb', File.read(path + '_stat.html.erb')
        create_file dashboard_objects_path + '_table.html.erb', File.read(path + '_table.html.erb')
      end
    end
  end
end